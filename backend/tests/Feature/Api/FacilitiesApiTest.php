<?php

namespace Tests\Feature\Api;

use App\Models\Facility;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilitiesApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeFacility(array $overrides = []): Facility
    {
        $location = Location::create([
            'name' => 'Site '.uniqid(),
            'barangay' => $overrides['barangay'] ?? 'Apopong',
            'location_type' => 'facility',
            'latitude' => 6.135,
            'longitude' => 125.165,
        ]);
        unset($overrides['barangay']);

        return Facility::create(array_merge([
            'location_id' => $location->id,
            'name' => 'Sample Health Center',
            'category' => 'health_center',
            'description' => 'Fictional facility for testing.',
            'contact_number' => '(083) 555-0101',
            'operating_hours' => 'Mon-Fri 8:00 AM - 5:00 PM',
        ], $overrides));
    }

    public function test_index_returns_paginated_facilities_with_location(): void
    {
        $this->makeFacility();
        $this->makeFacility(['name' => 'Second', 'category' => 'school']);

        $this->getJson('/api/facilities')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'category', 'location' => ['id', 'name']]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_filters_by_category_and_barangay(): void
    {
        $this->makeFacility();
        $this->makeFacility(['name' => 'Coastal Post', 'category' => 'emergency_facility', 'barangay' => 'Labangal']);

        $this->getJson('/api/facilities?category=school')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/facilities?category=emergency_facility')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/facilities?barangay=Labangal')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_index_searches_name_and_description(): void
    {
        $this->makeFacility(['name' => 'Sample Demo Hospital']);

        $this->getJson('/api/facilities?search=hospital')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_show_returns_facility_with_location(): void
    {
        $facility = $this->makeFacility();

        $this->getJson("/api/facilities/{$facility->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Sample Health Center')
            ->assertJsonPath('data.location.barangay', 'Apopong');
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/facilities/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }
}
