<?php

namespace Tests\Feature\Api;

use App\Models\DataSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataSourcesApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeSource(array $overrides = []): DataSource
    {
        return DataSource::create(array_merge([
            'name' => 'Sample Source '.uniqid(),
            'source_type' => 'official',
            'url' => 'https://example.ph/sample',
            'description' => 'Fictional source for testing.',
        ], $overrides));
    }

    public function test_index_returns_paginated_sources(): void
    {
        $this->makeSource();
        $this->makeSource(['source_type' => 'community', 'url' => null]);

        $this->getJson('/api/data-sources')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'source_type', 'url']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_filters_by_source_type_and_search(): void
    {
        $this->makeSource();
        $this->makeSource(['source_type' => 'community']);

        $this->getJson('/api/data-sources?source_type=community')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/data-sources?search=Fictional')->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_show_returns_source(): void
    {
        $source = $this->makeSource(['name' => 'Named Source']);

        $this->getJson("/api/data-sources/{$source->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Named Source');
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/data-sources/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }
}
