<?php

namespace Tests\Feature\Api;

use App\Models\Announcement;
use App\Models\DataSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeSource(): DataSource
    {
        return DataSource::create([
            'name' => 'Sample Test Source',
            'source_type' => 'official',
            'url' => 'https://example.ph/sample',
        ]);
    }

    private function makeAnnouncement(array $overrides = []): Announcement
    {
        return Announcement::create(array_merge([
            'title' => 'Sample Advisory',
            'content' => 'Fictional content for testing.',
            'category' => 'advisory',
            'source_id' => $this->makeSource()->id,
            'published_at' => now(),
            'status' => 'published',
        ], $overrides));
    }

    public function test_index_defaults_to_published(): void
    {
        $this->makeAnnouncement();
        $this->makeAnnouncement(['title' => 'Draft One', 'status' => 'draft', 'published_at' => null]);

        $this->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title', 'Sample Advisory');

        $this->getJson('/api/announcements?status=draft')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title', 'Sample Advisory');
    }

    public function test_index_filters_by_category_and_search(): void
    {
        $this->makeAnnouncement();
        $this->makeAnnouncement(['title' => 'Flood Notice', 'category' => 'emergency']);

        $this->getJson('/api/announcements?category=emergency')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/announcements?search=Flood')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_show_returns_announcement_with_source(): void
    {
        $announcement = $this->makeAnnouncement();

        $this->getJson("/api/announcements/{$announcement->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Sample Advisory')
            ->assertJsonPath('data.source.name', 'Sample Test Source');
    }

    public function test_show_unknown_id_returns_json_404(): void
    {
        $this->getJson('/api/announcements/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resource not found.');
    }

    public function test_show_does_not_expose_draft_or_archived_announcements(): void
    {
        $draft = $this->makeAnnouncement(['status' => 'draft']);
        $archived = $this->makeAnnouncement(['status' => 'archived']);

        $this->getJson("/api/announcements/{$draft->id}")->assertNotFound();
        $this->getJson("/api/announcements/{$archived->id}")->assertNotFound();
    }
}
