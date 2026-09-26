<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
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
        $user->save();

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
}
