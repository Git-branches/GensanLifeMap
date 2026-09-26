<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test Citizen',
            'email' => 'citizen@example.ph',
            'password' => 'password123',
            'role' => User::ROLE_CITIZEN,
        ], $overrides));
    }

    public function test_register_creates_citizen_and_issues_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Citizen',
            'email' => 'new@example.ph',
            'password' => 's3cure-password',
            'password_confirmation' => 's3cure-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'new@example.ph')
            ->assertJsonPath('data.user.role', User::ROLE_CITIZEN)
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'role'], 'token']])
            ->assertJsonMissing(['password' => 's3cure-password']);

        $this->assertTrue(Hash::check(
            's3cure-password',
            User::where('email', 'new@example.ph')->firstOrFail()->password
        ));
    }

    public function test_register_rejects_duplicate_email_and_ignores_role(): void
    {
        $this->makeUser();

        $this->postJson('/api/register', [
            'name' => 'Copycat',
            'email' => 'citizen@example.ph',
            'password' => 's3cure-password',
            'password_confirmation' => 's3cure-password',
            'role' => User::ROLE_ADMIN,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertSame(
            User::ROLE_CITIZEN,
            User::where('email', 'citizen@example.ph')->firstOrFail()->role
        );
    }

    public function test_login_issues_token_and_rejects_bad_credentials(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', [
            'email' => 'citizen@example.ph',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['data' => ['user' => ['id', 'email'], 'token']]);

        // Same generic message for wrong password and unknown email.
        $badPassword = $this->postJson('/api/login', [
            'email' => 'citizen@example.ph',
            'password' => 'wrong-password',
        ])->assertUnprocessable();

        $unknownEmail = $this->postJson('/api/login', [
            'email' => 'nobody@example.ph',
            'password' => 'wrong-password',
        ])->assertUnprocessable();

        $this->assertSame(
            $badPassword->json('errors.email'),
            $unknownEmail->json('errors.email')
        );
    }

    public function test_guest_cannot_reach_protected_endpoints(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->postJson('/api/logout')->assertUnauthorized();
        $this->putJson('/api/user/profile', ['name' => 'X'])->assertUnauthorized();
        $this->putJson('/api/user/password', [])->assertUnauthorized();
    }

    public function test_user_profile_update_and_role_guard(): void
    {
        $user = $this->makeUser();
        Sanctum::actingAs($user);

        $this->putJson('/api/user/profile', [
            'name' => 'Renamed Citizen',
            'role' => User::ROLE_ADMIN,
        ])->assertOk()->assertJsonPath('data.user.name', 'Renamed Citizen');

        $this->assertSame(User::ROLE_CITIZEN, $user->fresh()->role);
    }

    public function test_password_change_requires_current_and_confirmation(): void
    {
        $user = $this->makeUser();
        Sanctum::actingAs($user);

        $this->putJson('/api/user/password', [
            'current_password' => 'wrong-current',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);

        $this->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'brand-new-password',
            'password_confirmation' => 'mismatch',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        $this->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('brand-new-password', $user->fresh()->password));
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('lifemap-web')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        // Fresh guard instance: within one test the auth manager would
        // otherwise reuse the user memoized from the pre-logout request
        // (production boots a new app per HTTP request, so this only
        // affects the test environment).
        $this->app->forgetInstance('auth');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user')
            ->assertUnauthorized();
    }
}
