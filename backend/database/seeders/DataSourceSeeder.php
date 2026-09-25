<?php

namespace Database\Seeders;

use App\Models\DataSource;
use Illuminate\Database\Seeder;

// All records are clearly fictional samples for portfolio testing.
class DataSourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            [
                'name' => 'Sample City Public Information Office',
                'source_type' => 'official',
                'url' => 'https://example.ph/sample-city-pio',
                'description' => 'Fictional sample source representing city public information releases.',
                'last_verified_at' => now()->subDays(2),
            ],
            [
                'name' => 'Sample Council Resolution Archive',
                'source_type' => 'public_document',
                'url' => 'https://example.ph/sample-resolutions',
                'description' => 'Fictional sample archive of council documents for traceability demos.',
                'last_verified_at' => now()->subDays(10),
            ],
            [
                'name' => 'Sample Barangay Community Bulletin',
                'source_type' => 'community',
                'url' => null,
                'description' => 'Fictional sample community-submitted bulletin without a stable URL.',
                'last_verified_at' => now()->subDays(5),
            ],
            [
                'name' => 'Sample Weather Advisory Feed',
                'source_type' => 'official',
                'url' => 'https://example.ph/sample-weather-feed',
                'description' => 'Fictional sample weather advisory feed used for demo announcements.',
                'last_verified_at' => now()->subDay(),
            ],
            [
                'name' => 'GenSan LifeMap System (Sample)',
                'source_type' => 'system_generated',
                'url' => null,
                'description' => 'Fictional system-generated source for seed/demo content.',
                'last_verified_at' => now(),
            ],
        ];

        foreach ($sources as $data) {
            DataSource::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}
