<?php

namespace Database\Seeders;

use App\Models\CommunityReport;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;

// Fictional sample citizen reports only. Photo paths are placeholders.
class CommunityReportSeeder extends Seeder
{
    public function run(): void
    {
        $reports = [
            [
                'user' => 'citizen1@example.ph',
                'location' => 'Sample Lagao Road Project Site',
                'category' => 'road',
                'title' => 'Sample pothole cluster near demo intersection',
                'description' => 'Fictional sample report of potholes for testing the reporting flow.',
                'photo_path' => 'reports/sample-road-1.jpg',
                'status' => 'submitted',
            ],
            [
                'user' => 'citizen2@example.ph',
                'location' => 'Sample Bula Drainage Channel',
                'category' => 'flooding',
                'title' => 'Sample gutter overflow after demo rain',
                'description' => 'Fictional sample flooding report for testing verification flow.',
                'photo_path' => 'reports/sample-flood-1.jpg',
                'status' => 'under_review',
            ],
            [
                'user' => 'citizen1@example.ph',
                'location' => 'Sample Calumpang Riverside Area',
                'category' => 'garbage',
                'title' => 'Sample uncollected waste pile (demo)',
                'description' => 'Fictional sample garbage report already verified in this demo.',
                'photo_path' => 'reports/sample-garbage-1.jpg',
                'status' => 'verified',
            ],
            [
                'user' => 'citizen3@example.ph',
                'location' => 'Sample Fatima Streetlight Pilot Zone',
                'category' => 'streetlight',
                'title' => 'Sample busted streetlight (demo)',
                'description' => 'Fictional sample streetlight report marked resolved in this demo.',
                'photo_path' => null,
                'status' => 'resolved',
            ],
            [
                'user' => 'citizen2@example.ph',
                'location' => 'Sample Labangal Coastal Watch Post',
                'category' => 'environment',
                'title' => 'Sample coastal debris (demo)',
                'description' => 'Fictional sample environment report for testing.',
                'photo_path' => 'reports/sample-coast-1.jpg',
                'status' => 'submitted',
            ],
            [
                'user' => 'citizen3@example.ph',
                'location' => 'Sample Apopong Elementary School Site',
                'category' => 'accessibility',
                'title' => 'Sample broken ramp railing (demo)',
                'description' => 'Fictional sample accessibility report for testing.',
                'photo_path' => null,
                'status' => 'under_review',
            ],
            [
                'user' => 'citizen1@example.ph',
                'location' => 'Sample Calumpang Riverside Area',
                'category' => 'other',
                'title' => 'Sample duplicate test report (demo)',
                'description' => 'Fictional sample report rejected as a duplicate in this demo.',
                'photo_path' => null,
                'status' => 'rejected',
            ],
        ];

        foreach ($reports as $item) {
            $user = User::where('email', $item['user'])->firstOrFail();
            $location = Location::where('name', $item['location'])->firstOrFail();

            CommunityReport::updateOrCreate(
                ['title' => $item['title']],
                [
                    'user_id' => $user->id,
                    'location_id' => $location->id,
                    'category' => $item['category'],
                    'description' => $item['description'],
                    'photo_path' => $item['photo_path'],
                    'status' => $item['status'],
                ]
            );
        }
    }
}
