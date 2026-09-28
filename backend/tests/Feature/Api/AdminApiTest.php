<?php

namespace Tests\Feature\Api;

use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\CommunityReport;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role = User::ROLE_CITIZEN): User
    {
        return User::create([
            'name' => 'Staff '.uniqid(),
            'email' => uniqid().'@example.ph',
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function makeLocation(): Location
    {
        return Location::create([
            'name' => 'Existing Admin Location',
            'barangay' => 'Lagao',
            'location_type' => 'community_area',
            'latitude' => 6.11,
            'longitude' => 125.17,
        ]);
    }

    public function test_admin_api_requires_authentication_and_staff_role(): void
    {
        $this->getJson('/api/admin/overview')->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->getJson('/api/admin/overview')->assertForbidden();
        $this->getJson('/api/admin/locations')->assertForbidden();
        $this->postJson('/api/admin/locations', [])->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_moderator_is_limited_to_dashboard_and_report_moderation(): void
    {
        $moderator = $this->makeUser(User::ROLE_MODERATOR);
        Sanctum::actingAs($moderator);

        $this->getJson('/api/admin/overview')->assertOk()
            ->assertJsonPath('data.registered_users', null)
            ->assertJsonPath('data.recent_activity', []);
        $this->getJson('/api/admin/community-reports')->assertOk();
        $this->getJson('/api/admin/projects')->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/audit-logs')->assertForbidden();
    }

    public function test_admin_can_create_and_edit_city_data_with_audit_entries(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        Sanctum::actingAs($admin);

        $created = $this->postJson('/api/admin/locations', [
            'name' => 'North Market Site',
            'address' => 'Market Road',
            'barangay' => 'Lagao',
            'location_type' => 'public_space',
            'latitude' => 6.11,
            'longitude' => 125.17,
        ])->assertCreated()->assertJsonPath('data.name', 'North Market Site');

        $id = $created->json('data.id');
        $this->putJson("/api/admin/locations/{$id}", [
            'name' => 'Updated Market Site',
            'address' => 'Updated Road',
            'barangay' => 'Lagao',
            'location_type' => 'public_space',
            'latitude' => 6.12,
            'longitude' => 125.18,
        ])->assertOk()->assertJsonPath('data.name', 'Updated Market Site');

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'entity_type' => 'location',
            'entity_id' => $id,
            'action' => 'created',
        ]);
        $this->assertSame(2, AuditLog::where('entity_id', $id)->count());
        $this->getJson('/api/locations?search=Updated%20Market')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_manage_projects_facilities_and_sources_using_existing_tables(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $location = $this->makeLocation();
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/projects', [
            'location_id' => $location->id,
            'title' => 'Managed public works',
            'description' => 'Updated through management.',
            'category' => 'roads',
            'status' => 'planned',
            'completion_percentage' => 0,
        ])->assertCreated()->assertJsonPath('data.title', 'Managed public works');

        $this->postJson('/api/admin/facilities', [
            'location_id' => $location->id,
            'name' => 'Managed service point',
            'category' => 'public_facility',
            'description' => 'Shared public record.',
        ])->assertCreated()->assertJsonPath('data.location.id', $location->id);

        $this->postJson('/api/admin/data-sources', [
            'name' => 'Managed source',
            'source_type' => 'public_document',
            'url' => 'https://example.ph/records',
        ])->assertCreated()->assertJsonPath('data.source_type', 'public_document');
    }

    public function test_delete_actions_are_confirmable_audited_and_block_linked_records(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $location = $this->makeLocation();
        $project = \App\Models\Project::create([
            'location_id' => $location->id,
            'title' => 'Linked project',
            'category' => 'roads',
            'status' => 'planned',
            'completion_percentage' => 0,
        ]);
        $source = \App\Models\DataSource::create(['name' => 'Used source', 'source_type' => 'official']);
        Announcement::create(['title' => 'Uses source', 'content' => 'Content', 'category' => 'advisory', 'source_id' => $source->id, 'status' => 'draft']);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/locations/{$location->id}")->assertStatus(409);
        $this->deleteJson("/api/admin/data-sources/{$source->id}")->assertStatus(409);

        $this->deleteJson("/api/admin/projects/{$project->id}")->assertNoContent();
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
        $this->assertDatabaseHas('audit_logs', ['user_id' => $admin->id, 'entity_type' => 'project', 'entity_id' => $project->id, 'action' => 'deleted']);
    }

    public function test_admin_validation_and_relationship_rules_are_server_enforced(): void
    {
        Sanctum::actingAs($this->makeUser(User::ROLE_ADMIN));
        $this->postJson('/api/admin/locations', ['name' => ''])->assertUnprocessable()->assertJsonValidationErrors(['name', 'location_type']);
        $this->postJson('/api/admin/projects', [
            'location_id' => 999,
            'title' => 'Invalid project',
            'status' => 'unknown',
            'completion_percentage' => 120,
        ])->assertUnprocessable()->assertJsonValidationErrors(['location_id', 'status', 'completion_percentage']);
    }

    public function test_admin_can_publish_announcement_and_public_api_only_exposes_it_after_publish(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $source = \App\Models\DataSource::create(['name' => 'Admin Test Source', 'source_type' => 'official']);
        $announcement = Announcement::create([
            'title' => 'Admin draft item',
            'content' => 'Draft body.',
            'category' => 'advisory',
            'source_id' => $source->id,
            'status' => 'draft',
        ]);
        Sanctum::actingAs($admin);

        $this->getJson("/api/announcements/{$announcement->id}")->assertNotFound();
        $this->putJson("/api/admin/announcements/{$announcement->id}", [
            'title' => 'Published advisory',
            'content' => 'Current public text.',
            'category' => 'advisory',
            'source_id' => $source->id,
            'status' => 'published',
            'published_at' => null,
            'expires_at' => null,
        ])->assertOk()->assertJsonPath('data.status', 'published');

        $this->getJson("/api/announcements/{$announcement->id}")->assertOk()->assertJsonPath('data.title', 'Published advisory');
        $this->assertDatabaseHas('audit_logs', ['user_id' => $admin->id, 'entity_type' => 'announcement', 'action' => 'published']);
    }

    public function test_admin_user_management_is_safe_and_cannot_change_own_role(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $citizen = $this->makeUser();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/users?role=citizen')->assertOk()
            ->assertJsonPath('data.0.role', User::ROLE_CITIZEN)
            ->assertJsonMissingPath('data.0.password');
        $this->putJson("/api/admin/users/{$citizen->id}/role", ['role' => User::ROLE_MODERATOR])
            ->assertOk()->assertJsonPath('data.user.role', User::ROLE_MODERATOR);
        $this->putJson("/api/admin/users/{$admin->id}/role", ['role' => User::ROLE_CITIZEN])->assertUnprocessable();
        $this->putJson('/api/user/profile', ['name' => $admin->name, 'email' => $admin->email, 'role' => User::ROLE_CITIZEN])->assertOk();
        $this->assertSame(User::ROLE_ADMIN, $admin->fresh()->role);
    }

    public function test_admin_and_moderator_can_list_reports_and_only_staff_can_change_status(): void
    {
        $location = $this->makeLocation();
        $resident = $this->makeUser();
        $report = CommunityReport::create([
            'user_id' => $resident->id,
            'location_id' => $location->id,
            'category' => 'road',
            'title' => 'Pavement issue',
            'status' => 'submitted',
        ]);
        $moderator = $this->makeUser(User::ROLE_MODERATOR);
        Sanctum::actingAs($moderator);

        $this->getJson('/api/admin/community-reports?search=Pavement')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson("/api/admin/community-reports/{$report->id}")->assertOk()->assertJsonPath('data.user.id', $resident->id);
        $this->patchJson("/api/community-reports/{$report->id}/status", ['status' => 'under_review'])
            ->assertOk()->assertJsonPath('data.status', 'under_review');

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $moderator->id,
            'entity_type' => 'community_report',
            'entity_id' => $report->id,
            'action' => 'under_review',
        ]);

        Sanctum::actingAs($resident);
        $this->getJson('/api/admin/community-reports')->assertForbidden();
    }

    public function test_audit_log_list_is_read_only_for_admin_api(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        AuditLog::create(['user_id' => $admin->id, 'action' => 'updated', 'entity_type' => 'location', 'entity_id' => 3, 'new_values' => ['name' => 'North site']]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/audit-logs?search=location')->assertOk()
            ->assertJsonPath('data.0.actor.name', $admin->name)
            ->assertJsonPath('data.0.entity_type', 'location');
        $this->deleteJson('/api/admin/audit-logs/1')->assertNotFound();
    }
}
