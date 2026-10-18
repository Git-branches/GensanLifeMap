<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\EmailVerificationLink;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new citizen account and issue its first API token.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $attributes = $request->accountAttributes();

        $user = User::create([
            'name' => $attributes['name'],
            'email' => $attributes['email'],
            // Hashed by the model's `hashed` cast; never stored raw.
            'password' => $attributes['password'],
            'role' => User::ROLE_CITIZEN,
        ]);

        $this->sendVerificationEmail($user);

        $token = $user->createToken('lifemap-web')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Account created. You are now signed in.',
        ], 201);
    }

    /**
     * Verify credentials and issue a new API token for this session.
     * Uses one generic failure message so responses do not reveal
     * whether an email address is registered (no enumeration).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only(['email', 'password']);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();
        $token = $user->createToken('lifemap-web')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Signed in successfully.',
        ]);
    }

    /**
     * Revoke only the token used for this request. Other sessions
     * (other devices) keep working — logout is per-session, not global.
     */
    public function logout(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $user->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Signed out successfully.',
        ]);
    }

    /**
     * Return the currently authenticated user (safe fields only).
     */
    public function user(): UserResource
    {
        /** @var User $user */
        $user = Auth::user();

        return new UserResource($user);
    }

    /**
     * Update the authenticated user's own name/email. Role is never
     * accepted here (see UpdateProfileRequest) — it stays exactly
     * what it was regardless of what the client sends.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->fill($request->only(['name', 'email']));
        $emailChanged = $user->isDirty('email');
        if ($emailChanged) {
            // A new address must be confirmed again.
            $user->email_verified_at = null;
        }
        $user->save();

        if ($emailChanged) {
            $this->sendVerificationEmail($user);
        }

        return response()->json([
            'data' => ['user' => new UserResource($user->fresh())],
            'message' => 'Profile updated.',
        ]);
    }

    /**
     * Change the authenticated user's own password after verifying
     * the current one. Other sessions are left intact; only the
     * credential itself changes here.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        // Hashed by the model's `hashed` cast; never stored or logged raw.
        $user->password = $request->validated()['password'];
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }

    /**
     * Start a password reset. The response is identical whether or not the
     * address is registered (and even if mail delivery fails), so it cannot
     * be used to discover accounts.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'string', 'email', 'max:255']]);

        try {
            Password::sendResetLink(['email' => $validated['email']]);
        } catch (\Throwable $exception) {
            report($exception);
        }

        return response()->json([
            'message' => 'If that email address is registered, a password reset link is on its way.',
        ]);
    }

    /**
     * Finish a password reset with the emailed token. Every existing API
     * token for the account is revoked, so a reset also signs out any
     * session an attacker may have held.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only(['email', 'password', 'password_confirmation', 'token']),
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            // One message for bad token, expired token and unknown email.
            throw ValidationException::withMessages([
                'email' => ['This reset link is invalid or has expired. Request a new one.'],
            ]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

    /**
     * Confirm an email address from the link in the verification email.
     * Works whether or not the visitor is signed in; the signed values in
     * the link are the proof.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer'],
            'hash' => ['required', 'string'],
            'expires' => ['required', 'integer'],
            'signature' => ['required', 'string'],
        ]);

        $user = User::find($validated['id']);

        if (! $user || ! EmailVerificationLink::isValid($user, $validated['hash'], (int) $validated['expires'], $validated['signature'])) {
            throw ValidationException::withMessages([
                'signature' => ['This verification link is invalid or has expired. Request a new one from your profile.'],
            ]);
        }

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json([
            'data' => ['user' => new UserResource($user->fresh())],
            'message' => 'Your email address is verified.',
        ]);
    }

    /**
     * Send the signed-in user a fresh verification email.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email address is already verified.']);
        }

        if (! $this->sendVerificationEmail($user)) {
            return response()->json([
                'message' => 'We could not send the email right now. Please try again later.',
            ], 503);
        }

        return response()->json(['message' => 'Verification email sent. Check your inbox.']);
    }

    /**
     * Mail problems must never break sign-up or profile edits; they are
     * reported and the caller can offer a resend.
     */
    private function sendVerificationEmail(User $user): bool
    {
        try {
            $user->sendEmailVerificationNotification();

            return true;
        } catch (\Throwable $exception) {
            report($exception);

            return false;
        }
    }}
