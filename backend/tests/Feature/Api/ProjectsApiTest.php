<?php

namespace Tests\Feature\Api;

use App\Models\Location;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeProject(array $overrides = []): Project
    {
        $location = Location::create([
            'name' => 'Site '.uniqid(),
            'barangay' => $overrides['barangay'] ?? 'Lagao',
            'location_type' => 'project_site',
            'latitude' => 6.1161,
            'longitude' => 125.175,
        ]);
        unset($overrides['barangay']);

        return Project::create(array_merge([
            'location_id' => $location->id,
            'title' => 'Sample Road Project',
            'description' => 'Fictional road works for testing.',
            'category' => 'roads',
            'status' => 'ongoing',
            'budget' => 1000000.00,
            'contract_amount' => 950000.00,
            'completion_percentage' => 40,
        ], $overrides));
    }

    public function test_index_returns_paginated_projects_with_location(): void
    {
        $this->makeProject();
        $this->makeProject(['title' => 'Second', 'status' => 'completed']);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'title', 'status', 'location' => ['id', 'name', 'barangay']]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_filters_by_status_category_and_barangay(): void
    {
        $this->makeProject();
        $this->makeProject(['title' => 'Drainage', 'status' => 'planned', 'category' => 'drainage', 'barangay' => 'Bula']);

        $this->getJson('/api/projects?status=ongoing')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/projects?category=drainage')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/projects?barangay=Bula')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/projects?status=bogus')->assertUnprocessable();
    }

    public function test_index_searches_title_and_description(): void
    {
        $this->makeProject(['title' => 'Solar Streetlight Pilot']);

        $this->getJson('/api/projects?search=Streetlight')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/projects?search=road works')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_show_returns_project_with_location(): void
    {
        $project = $this->makeProject();

        $this->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Sample Road Project')
            ->assertJsonPath('data.location.barangay', 'Lagao');
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/projects/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }
}
