<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\Project;
use Illuminate\Database\Seeder;

// Fictional sample projects only — not real government records.
class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            [
                'location' => 'Sample Lagao Road Project Site',
                'title' => 'Sample Lagao Road Concreting (Demo)',
                'description' => 'Fictional sample road concreting project used for portfolio testing.',
                'category' => 'roads',
                'status' => 'ongoing',
                'budget' => 12500000.00,
                'contract_amount' => 11950000.00,
                'start_date' => '2026-03-01',
                'target_completion' => '2026-12-15',
                'completion_percentage' => 45,
            ],
            [
                'location' => 'Sample Bula Drainage Channel',
                'title' => 'Sample Bula Drainage Rehabilitation (Demo)',
                'description' => 'Fictional sample drainage project for flood-mitigation demos.',
                'category' => 'drainage',
                'status' => 'procurement',
                'budget' => 8300000.00,
                'contract_amount' => null,
                'start_date' => null,
                'target_completion' => '2027-05-30',
                'completion_percentage' => 0,
            ],
            [
                'location' => 'Sample Calumpang Riverside Area',
                'title' => 'Sample Riverside Slope Protection (Demo)',
                'description' => 'Fictional sample completed slope-protection project.',
                'category' => 'flood_control',
                'status' => 'completed',
                'budget' => 5400000.00,
                'contract_amount' => 5275000.00,
                'start_date' => '2025-06-01',
                'target_completion' => '2026-02-28',
                'completion_percentage' => 100,
            ],
            [
                'location' => 'Sample Fatima Streetlight Pilot Zone',
                'title' => 'Sample Solar Streetlight Pilot (Demo)',
                'description' => 'Fictional sample solar streetlight pilot project.',
                'category' => 'streetlight',
                'status' => 'planned',
                'budget' => 2100000.00,
                'contract_amount' => null,
                'start_date' => null,
                'target_completion' => '2027-01-31',
                'completion_percentage' => 0,
            ],
            [
                'location' => 'Sample San Isidro Health Center Site',
                'title' => 'Sample Health Center Repair (Demo)',
                'description' => 'Fictional sample facility repair project, currently delayed in this demo.',
                'category' => 'health',
                'status' => 'delayed',
                'budget' => 3750000.00,
                'contract_amount' => 3600000.00,
                'start_date' => '2026-01-15',
                'target_completion' => '2026-08-30',
                'completion_percentage' => 30,
            ],
            [
                'location' => 'Sample Apopong Elementary School Site',
                'title' => 'Sample Cancelled Classroom Demo Project',
                'description' => 'Fictional sample cancelled project used to test status filters.',
                'category' => 'education',
                'status' => 'cancelled',
                'budget' => 6000000.00,
                'contract_amount' => null,
                'start_date' => null,
                'target_completion' => null,
                'completion_percentage' => 0,
            ],
        ];

        foreach ($projects as $item) {
            $location = Location::where('name', $item['location'])->firstOrFail();
            unset($item['location']);
            $item['location_id'] = $location->id;

            Project::updateOrCreate(
                ['title' => $item['title']],
                $item
            );
        }
    }
}
