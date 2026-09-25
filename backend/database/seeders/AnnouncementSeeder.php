<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\DataSource;
use Illuminate\Database\Seeder;

// Fictional sample announcements only.
class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $announcements = [
            [
                'title' => 'Sample Road Works Advisory in Lagao (Demo)',
                'content' => 'Fictional sample advisory: expect demo road works near the Lagao sample site next week.',
                'category' => 'advisory',
                'source' => 'Sample City Public Information Office',
                'published_at' => now()->subDays(1),
                'expires_at' => now()->addDays(14),
                'status' => 'published',
            ],
            [
                'title' => 'Sample Drainage Project Update in Bula (Demo)',
                'content' => 'Fictional sample update on the demo drainage rehabilitation procurement stage.',
                'category' => 'project_update',
                'source' => 'Sample Council Resolution Archive',
                'published_at' => now()->subDays(3),
                'expires_at' => now()->addDays(30),
                'status' => 'published',
            ],
            [
                'title' => 'Sample Heavy Rain Notice (Demo)',
                'content' => 'Fictional sample emergency notice: secure loose items near demo riverside areas.',
                'category' => 'emergency',
                'source' => 'Sample Weather Advisory Feed',
                'published_at' => now()->subHours(6),
                'expires_at' => now()->addDays(2),
                'status' => 'published',
            ],
            [
                'title' => 'Sample Coastal Clean-Up Drive (Demo)',
                'content' => 'Fictional sample community clean-up event near the Labangal demo site.',
                'category' => 'community',
                'source' => 'Sample Barangay Community Bulletin',
                'published_at' => now()->subDays(2),
                'expires_at' => now()->addDays(10),
                'status' => 'published',
            ],
            [
                'title' => 'Draft: Sample Health Center Notice (Demo)',
                'content' => 'Fictional draft notice, not yet published.',
                'category' => 'public_notice',
                'source' => 'GenSan LifeMap System (Sample)',
                'published_at' => null,
                'expires_at' => null,
                'status' => 'draft',
            ],
            [
                'title' => 'Archived: Sample Old Fiesta Notice (Demo)',
                'content' => 'Fictional sample expired notice kept to test archived filters.',
                'category' => 'other',
                'source' => 'Sample Barangay Community Bulletin',
                'published_at' => now()->subDays(60),
                'expires_at' => now()->subDays(30),
                'status' => 'archived',
            ],
        ];

        foreach ($announcements as $item) {
            $source = DataSource::where('name', $item['source'])->firstOrFail();

            Announcement::updateOrCreate(
                ['title' => $item['title']],
                [
                    'content' => $item['content'],
                    'category' => $item['category'],
                    'source_id' => $source->id,
                    'published_at' => $item['published_at'],
                    'expires_at' => $item['expires_at'],
                    'status' => $item['status'],
                ]
            );
        }
    }
}
