<?php

namespace Tests\Feature\Api;

use App\Models\CommunityReport;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommunityReportsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Sample Citizen',
            'email' => 'citizen-'.uniqid().'@example.ph',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
        ]);
    }

    private function makeLocation(): Location
    {
        return Location::create([
            'name' => 'Site '.uniqid(),
            'barangay' => 'Lagao',
            'location_type' => 'community_area',
            'latitude' => 6.1055,
            'longitude' => 125.166,
        ]);
    }

    private function makeReport(array $overrides = []): CommunityReport
    {
        return CommunityReport::create(array_merge([
            'user_id' => $this->makeUser()->id,
            'location_id' => $this->makeLocation()->id,
            'category' => 'road',
            'title' => 'Sample pothole report',
            'description' => 'Fictional report for testing.',
            'status' => 'submitted',
        ], $overrides));
    }

    public function test_index_returns_reports_with_safe_user_and_location(): void
    {
        $this->makeReport();

        $response = $this->getJson('/api/community-reports');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'category', 'title', 'status', 'user' => ['id', 'name'], 'location' => ['id', 'name']]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        // No sensitive user fields may leak.
        $this->assertArrayNotHasKey('email', $response->json('data.0.user'));
        $this->assertArrayNotHasKey('password', $response->json('data.0.user'));
        $this->assertStringNotContainsString('password', $response->getContent());
    }

    public function test_index_filters_by_category_and_status(): void
    {
        $this->makeReport();
        $this->makeReport(['title' => 'Flood one', 'category' => 'flooding', 'status' => 'verified']);

        $this->getJson('/api/community-reports?category=flooding')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/community-reports?status=verified')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_store_creates_submitted_report(): void
    {
        $user = $this->makeUser();
        $location = $this->makeLocation();

        $response = $this->postJson('/api/community-reports', [
            'user_id' => $user->id,
            'location_id' => $location->id,
            'category' => 'flooding',
            'title' => 'Gutter overflow after demo rain',
            'description' => 'Fictional submission.',
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'submitted');
        $this->assertDatabaseHas('community_reports', [
            'title' => 'Gutter overflow after demo rain',
            'status' => 'submitted',
        ]);
    }

    public function test_store_forces_submitted_status_and_rejects_privileged_values(): void
    {
        $user = $this->makeUser();
        $location = $this->makeLocation();

        // A citizen attempt to self-verify must be ignored, not honored.
        $response = $this->postJson('/api/community-reports', [
            'user_id' => $user->id,
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Self-verify attempt',
            'status' => 'verified',
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'submitted');
    }

    public function test_store_accepts_photo_upload(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();
        $location = $this->makeLocation();

        $response = $this->post('/api/community-reports', [
            'user_id' => $user->id,
            'location_id' => $location->id,
            'category' => 'garbage',
            'title' => 'Waste pile with photo',
            'photo' => UploadedFile::fake()->image('pile.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $photoPath = $response->json('data.photo_path');
        $this->assertNotNull($photoPath);
        Storage::disk('public')->assertExists($photoPath);
    }

    public function test_store_validation_errors(): void
    {
        $response = $this->postJson('/api/community-reports', [
            'category' => 'not-a-category',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'The given data was invalid.')
            ->assertJsonValidationErrors(['user_id', 'location_id', 'category', 'title']);
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/community-reports/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }

    public function test_status_update_requires_authentication(): void
    {
        $report = $this->makeReport();

        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'verified'])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Authentication required. Admin authentication will be enabled in the next phase.');

        // Status must remain untouched.
        $this->assertSame('submitted', $report->fresh()->status);
    }
}
