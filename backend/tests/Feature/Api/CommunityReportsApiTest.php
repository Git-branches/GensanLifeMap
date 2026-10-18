<?php

namespace Tests\Feature\Api;

use App\Models\CommunityReport;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
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

    public function test_mine_returns_only_owned_reports_with_safe_user_and_location(): void
    {
        $user = $this->makeUser();
        $owned = $this->makeReport(['user_id' => $user->id]);
        $this->makeReport();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/community-reports/mine');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'category', 'title', 'status', 'user' => ['id', 'name'], 'location' => ['id', 'name']]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $owned->id);

        // No sensitive user fields may leak.
        $this->assertArrayNotHasKey('email', $response->json('data.0.user'));
        $this->assertArrayNotHasKey('password', $response->json('data.0.user'));
        $this->assertStringNotContainsString('password', $response->getContent());
    }

    public function test_mine_filters_by_category_and_status(): void
    {
        $user = $this->makeUser();
        $this->makeReport(['user_id' => $user->id]);
        $this->makeReport(['user_id' => $user->id, 'title' => 'Flood one', 'category' => 'flooding', 'status' => 'verified']);
        Sanctum::actingAs($user);

        $this->getJson('/api/community-reports/mine?category=flooding')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/community-reports/mine?status=verified')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_store_creates_submitted_report(): void
    {
        $user = $this->makeUser();
        $impostor = $this->makeUser();
        $location = $this->makeLocation();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/community-reports', [
            'user_id' => $impostor->id,
            'location_id' => $location->id,
            'category' => 'flooding',
            'title' => 'Gutter overflow after demo rain',
            'description' => 'Fictional submission.',
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.user.id', $user->id);
        $this->assertDatabaseHas('community_reports', [
            'title' => 'Gutter overflow after demo rain',
            'status' => 'submitted',
        ]);
    }

    public function test_store_forces_submitted_status_and_rejects_privileged_values(): void
    {
        $user = $this->makeUser();
        $location = $this->makeLocation();
        Sanctum::actingAs($user);

        // A citizen attempt to self-verify must be ignored, not honored.
        $response = $this->postJson('/api/community-reports', [
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Self-verify attempt',
            'status' => 'verified',
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.user.id', $user->id);
    }

    public function test_store_accepts_photo_upload(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();
        $location = $this->makeLocation();
        Sanctum::actingAs($user);

        $response = $this->post('/api/community-reports', [
            'location_id' => $location->id,
            'category' => 'garbage',
            'title' => 'Waste pile with photo',
            'photo' => UploadedFile::fake()->image('pile.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $photoPath = $response->json('data.photo_path');
        $this->assertNotNull($photoPath);
        $this->assertTrue(Storage::disk('public')->exists($photoPath));
    }

    public function test_store_saves_pinned_coordinates(): void
    {
        $location = $this->makeLocation();
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/community-reports', [
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Pinned pothole',
            'latitude' => 6.1101234,
            'longitude' => 125.1722345,
        ])
            ->assertCreated()
            ->assertJsonPath('data.latitude', 6.1101234)
            ->assertJsonPath('data.longitude', 125.1722345);
    }

    public function test_store_requires_both_coordinates_and_valid_ranges(): void
    {
        $location = $this->makeLocation();
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/community-reports', [
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Half a pin',
            'latitude' => 6.11,
        ])->assertUnprocessable()->assertJsonValidationErrors(['longitude']);

        $this->postJson('/api/community-reports', [
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Off the map',
            'latitude' => 123,
            'longitude' => 125.17,
        ])->assertUnprocessable()->assertJsonValidationErrors(['latitude']);
    }

    public function test_show_includes_photo_url_and_status_timeline_without_staff_identity(): void
    {
        $owner = $this->makeUser();
        $report = $this->makeReport(['user_id' => $owner->id, 'photo_path' => 'reports/example.jpg']);
        $moderator = $this->makeUser();
        $moderator->update(['role' => User::ROLE_MODERATOR]);

        Sanctum::actingAs($moderator);
        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'under_review'])->assertOk();
        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'resolved'])->assertOk();

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/community-reports/{$report->id}")->assertOk();

        $this->assertStringEndsWith('/storage/reports/example.jpg', $response->json('data.photo_url'));
        $this->assertSame(
            ['submitted', 'under_review', 'resolved'],
            array_column($response->json('data.timeline'), 'status'),
        );
        $this->assertStringNotContainsString((string) $moderator->email, $response->getContent());
        $this->assertArrayNotHasKey('user_id', $response->json('data.timeline.1'));

        // The list view stays lightweight: no timeline.
        $this->getJson('/api/community-reports/mine')->assertOk()->assertJsonMissingPath('data.0.timeline');
    }

    public function test_status_note_reaches_the_resident_but_staff_names_do_not(): void
    {
        $owner = $this->makeUser();
        $report = $this->makeReport(['user_id' => $owner->id]);
        $moderator = $this->makeUser();
        $moderator->update(['name' => 'Staff Reviewer', 'role' => User::ROLE_MODERATOR]);

        Sanctum::actingAs($moderator);
        $this->patchJson("/api/community-reports/{$report->id}/status", [
            'status' => 'under_review',
            'note' => '  Crew scheduled for Friday.  ',
        ])
            ->assertOk()
            // Staff see who made each change.
            ->assertJsonPath('data.timeline.1.by', 'Staff Reviewer')
            ->assertJsonPath('data.timeline.1.note', 'Crew scheduled for Friday.');

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/community-reports/{$report->id}")->assertOk();

        $this->assertSame('Crew scheduled for Friday.', $response->json('data.timeline.1.note'));
        $this->assertNull($response->json('data.timeline.0.note'));
        $this->assertArrayNotHasKey('by', $response->json('data.timeline.1'));
        $this->assertStringNotContainsString('Staff Reviewer', $response->getContent());
    }

    public function test_status_note_is_optional_and_length_limited(): void
    {
        $report = $this->makeReport();
        $moderator = $this->makeUser();
        $moderator->update(['role' => User::ROLE_MODERATOR]);
        Sanctum::actingAs($moderator);

        $this->patchJson("/api/community-reports/{$report->id}/status", [
            'status' => 'under_review',
            'note' => str_repeat('x', 501),
        ])->assertUnprocessable()->assertJsonValidationErrors(['note']);

        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'under_review'])
            ->assertOk()
            ->assertJsonPath('data.timeline.1.note', null);
    }

    public function test_admin_report_view_and_barangay_filter(): void
    {
        $lagao = $this->makeReport(['title' => 'Lagao report']);
        $other = $this->makeReport([
            'title' => 'Bula report',
            'location_id' => Location::create([
                'name' => 'Bula site', 'barangay' => 'Bula', 'location_type' => 'community_area',
                'latitude' => 6.09, 'longitude' => 125.2,
            ])->id,
        ]);
        $moderator = $this->makeUser();
        $moderator->update(['role' => User::ROLE_MODERATOR]);
        Sanctum::actingAs($moderator);

        $this->getJson('/api/admin/community-reports?barangay=Bula')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $other->id);

        $this->getJson("/api/admin/community-reports/{$lagao->id}")
            ->assertOk()
            ->assertJsonPath('data.timeline.0.status', 'submitted')
            ->assertJsonPath('data.timeline.0.by', $lagao->user->name);
    }

    public function test_store_validation_errors(): void
    {
        Sanctum::actingAs($this->makeUser());
        $response = $this->postJson('/api/community-reports', [
            'category' => 'not-a-category',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'The given data was invalid.')
            ->assertJsonValidationErrors(['location_id', 'category', 'title']);
    }

    public function test_guest_cannot_access_or_submit_reports(): void
    {
        $report = $this->makeReport();
        $this->getJson('/api/community-reports/mine')->assertUnauthorized();
        $this->getJson("/api/community-reports/{$report->id}")->assertUnauthorized();
        $this->postJson('/api/community-reports', [])->assertUnauthorized();
    }

    public function test_user_cannot_view_another_users_report(): void
    {
        $report = $this->makeReport();
        Sanctum::actingAs($this->makeUser());
        $this->getJson("/api/community-reports/{$report->id}")->assertNotFound();
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        Sanctum::actingAs($this->makeUser());
        $this->getJson('/api/community-reports/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }

    public function test_citizen_cannot_moderate_report(): void
    {
        $report = $this->makeReport();
        Sanctum::actingAs($this->makeUser());

        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'verified'])
            ->assertForbidden();

        // Status must remain untouched.
        $this->assertSame('submitted', $report->fresh()->status);
    }

    public function test_moderator_can_update_report_status_and_audit_actor_is_recorded(): void
    {
        $report = $this->makeReport();
        $moderator = $this->makeUser();
        $moderator->update(['role' => User::ROLE_MODERATOR]);
        Sanctum::actingAs($moderator);

        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'under_review'])
            ->assertOk()
            ->assertJsonPath('data.status', 'under_review');

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $moderator->id,
            'entity_id' => $report->id,
            'old_values->status' => 'submitted',
            'new_values->status' => 'under_review',
        ]);
    }
}
