<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountRecoveryApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $overrides = []): User
    {
        // forceFill: email_verified_at is deliberately not mass-assignable.
        $user = new User();
        $user->forceFill(array_merge([
            'name' => 'Sample Citizen',
            'email' => 'citizen-'.uniqid().'@example.ph',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'email_verified_at' => now(),
        ], $overrides))->save();

        return $user;
    }

    /** @return array<string, string> query parameters of the link in the notification */
    private function linkParameters(string $url): array
    {
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return $query;
    }

    // ---------- password reset ----------

    public function test_forgot_password_gives_the_same_answer_for_known_and_unknown_emails(): void
    {
        Notification::fake();
        $user = $this->makeUser();

        $known = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'nobody@example.ph'])->assertOk();

        $this->assertSame($known->json('message'), $unknown->json('message'));
        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertCount(1);
    }

    public function test_forgot_password_validates_the_email_field(): void
    {
        $this->postJson('/api/forgot-password', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_link_points_to_the_frontend_and_resets_the_password(): void
    {
        Notification::fake();
        $user = $this->makeUser();
        $user->createToken('old-session');

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user, &$token): bool {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith(rtrim(config('app.frontend_url'), '/').'/reset-password?', $url);
            $query = $this->linkParameters($url);
            $this->assertSame($user->email, $query['email']);
            $token = $query['token'];

            return true;
        });

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'a-brand-new-pass',
            'password_confirmation' => 'a-brand-new-pass',
        ])->assertOk();

        $this->assertTrue(Hash::check('a-brand-new-pass', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count(), 'all existing sessions are revoked');

        // The new password signs in; the old one does not.
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'a-brand-new-pass'])->assertOk();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password123'])->assertUnprocessable();

        // The token is single-use.
        $this->postJson('/api/reset-password', [
            'token' => $token, 'email' => $user->email,
            'password' => 'another-pass-123', 'password_confirmation' => 'another-pass-123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_reset_rejects_bad_tokens_unknown_emails_and_weak_input_with_one_message(): void
    {
        $user = $this->makeUser();
        $payload = ['password' => 'a-brand-new-pass', 'password_confirmation' => 'a-brand-new-pass'];

        $badToken = $this->postJson('/api/reset-password', $payload + ['token' => 'nope', 'email' => $user->email]);
        $unknown = $this->postJson('/api/reset-password', $payload + ['token' => 'nope', 'email' => 'ghost@example.ph']);

        $badToken->assertUnprocessable()->assertJsonValidationErrors(['email']);
        $this->assertSame($badToken->json('errors.email'), $unknown->json('errors.email'));
        $this->assertTrue(Hash::check('password123', $user->fresh()->password), 'password untouched');

        $this->postJson('/api/reset-password', [
            'token' => 'x', 'email' => $user->email, 'password' => 'short', 'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        $this->postJson('/api/reset-password', [
            'token' => 'x', 'email' => $user->email, 'password' => 'a-brand-new-pass', 'password_confirmation' => 'different-pass',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
    }

    // ---------- email verification ----------

    public function test_registering_sends_a_verification_email_and_leaves_the_account_unverified(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'New Resident',
            'email' => 'new.resident@example.ph',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $this->assertNull($response->json('data.user.email_verified_at'));
        Notification::assertSentTo(User::where('email', 'new.resident@example.ph')->first(), VerifyEmail::class);
    }

    public function test_verification_link_confirms_the_email_once_and_can_be_replayed_safely(): void
    {
        Notification::fake();
        $user = $this->makeUser(['email_verified_at' => null]);
        $user->sendEmailVerificationNotification();

        $query = [];
        Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $notification) use ($user, &$query): bool {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith(rtrim(config('app.frontend_url'), '/').'/verify-email?', $url);
            $query = $this->linkParameters($url);

            return true;
        });

        // Not signed in: the signed values are the proof.
        $this->postJson('/api/email/verify', $query)
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->postJson('/api/email/verify', $query)->assertOk();
    }

    public function test_verification_rejects_tampered_expired_and_stale_links(): void
    {
        Notification::fake();
        $user = $this->makeUser(['email_verified_at' => null]);
        $other = $this->makeUser(['email_verified_at' => null]);
        $user->sendEmailVerificationNotification();

        $query = [];
        Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $notification) use ($user, &$query): bool {
            $query = $this->linkParameters($notification->toMail($user)->actionUrl);

            return true;
        });

        // Wrong signature, and a link replayed against someone else's id.
        $this->postJson('/api/email/verify', array_merge($query, ['signature' => str_repeat('0', 64)]))->assertUnprocessable();
        $this->postJson('/api/email/verify', array_merge($query, ['id' => $other->id]))->assertUnprocessable();
        $this->assertNull($other->fresh()->email_verified_at);

        // A changed email address invalidates links issued for the old one.
        $user->update(['email' => 'changed@example.ph']);
        $this->postJson('/api/email/verify', $query)->assertUnprocessable();
        $this->assertNull($user->fresh()->email_verified_at);

        // Expired.
        $this->travel(2)->days();
        $this->postJson('/api/email/verify', $query)->assertUnprocessable();
    }

    public function test_changing_email_resets_verification_and_sends_a_new_email(): void
    {
        Notification::fake();
        $user = $this->makeUser();
        Sanctum::actingAs($user);

        $this->putJson('/api/user/profile', ['email' => 'moved@example.ph'])
            ->assertOk()
            ->assertJsonPath('data.user.email_verified_at', null);

        $this->assertNull($user->fresh()->email_verified_at);
        Notification::assertSentTo($user->fresh(), VerifyEmail::class);

        // Editing only the name leaves things alone.
        Notification::fake();
        $user->fresh()->forceFill(['email_verified_at' => now()])->save();
        $this->putJson('/api/user/profile', ['name' => 'Renamed Resident'])->assertOk();
        Notification::assertNothingSent();
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_resend_requires_sign_in_and_skips_verified_accounts(): void
    {
        Notification::fake();

        $this->postJson('/api/email/verification-notification')->assertUnauthorized();

        $verified = $this->makeUser();
        Sanctum::actingAs($verified);
        $this->postJson('/api/email/verification-notification')->assertOk();
        Notification::assertNothingSent();

        $unverified = $this->makeUser(['email_verified_at' => null]);
        Sanctum::actingAs($unverified);
        $this->postJson('/api/email/verification-notification')->assertOk();
        Notification::assertSentTo($unverified, VerifyEmail::class);
    }

    public function test_strict_limits_are_not_used_up_by_ordinary_requests(): void
    {
        Notification::fake();
        $user = $this->makeUser(['email_verified_at' => null]);
        Sanctum::actingAs($user);

        // A dashboard load makes several API calls before the resident clicks "Resend".
        for ($i = 0; $i < 6; $i++) {
            $this->getJson('/api/user')->assertOk();
        }
        $this->postJson('/api/email/verification-notification')->assertOk();

        // Same for guests: browsing first, then asking for a reset link.
        for ($i = 0; $i < 8; $i++) {
            $this->getJson('/api/locations')->assertOk();
        }
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    }

    public function test_resend_is_limited_to_three_per_minute(): void
    {
        Notification::fake();
        Sanctum::actingAs($this->makeUser(['email_verified_at' => null]));

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/email/verification-notification')->assertOk();
        }
        $this->postJson('/api/email/verification-notification')->assertStatus(429);
    }}
