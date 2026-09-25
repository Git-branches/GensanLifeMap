<?php

namespace Tests\Feature\Api;

use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeLocation(array $overrides = []): Location
    {
        return Location::create(array_merge([
            'name' => 'Sample Test Site',
            'address' => 'Sample St., Lagao',
            'barangay' => 'Lagao',
            'location_type' => 'project_site',
            'latitude' => 6.1161000,
            'longitude' => 125.1750000,
        ], $overrides));
    }

    public function test_index_returns_paginated_locations(): void
    {
        $this->makeLocation();
        $this->makeLocation(['name' => 'Second Site', 'barangay' => 'Bula']);

        $response = $this->getJson('/api/locations');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'barangay', 'location_type', 'latitude', 'longitude']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 15);
    }

    public function test_index_filters_by_barangay_and_type(): void
    {
        $this->makeLocation();
        $this->makeLocation(['name' => 'Other', 'barangay' => 'Bula', 'location_type' => 'facility']);

        $this->getJson('/api/locations?barangay=Lagao')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Sample Test Site');

        $this->getJson('/api/locations?location_type=facility')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_index_searches_controlled_fields(): void
    {
        $this->makeLocation(['name' => 'Riverside Demo Area']);

        $this->getJson('/api/locations?search=Riverside')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/locations?search=NoSuchPlace')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_index_rejects_excessive_per_page(): void
    {
        $this->getJson('/api/locations?per_page=100')->assertUnprocessable();
    }

    public function test_show_returns_location(): void
    {
        $location = $this->makeLocation();

        $this->getJson("/api/locations/{$location->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Sample Test Site');
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/locations/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }
}
