<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\Location;
use Illuminate\Database\Seeder;

// Fictional sample facilities only.
class FacilitySeeder extends Seeder
{
    public function run(): void
    {
        $facilities = [
            [
                'location' => 'Sample San Isidro Health Center Site',
                'name' => 'Sample San Isidro Health Center',
                'category' => 'health_center',
                'description' => 'Fictional sample barangay health center for demo purposes.',
                'contact_number' => '(083) 555-0101',
                'operating_hours' => 'Mon-Fri 8:00 AM - 5:00 PM',
            ],
            [
                'location' => 'Sample Apopong Elementary School Site',
                'name' => 'Sample Apopong Elementary School',
                'category' => 'school',
                'description' => 'Fictional sample public school for demo purposes.',
                'contact_number' => '(083) 555-0102',
                'operating_hours' => 'Mon-Fri 7:00 AM - 4:00 PM',
            ],
            [
                'location' => 'Sample Dadiangas North Evacuation Hall',
                'name' => 'Sample Dadiangas North Evacuation Hall',
                'category' => 'emergency_facility',
                'description' => 'Fictional sample evacuation facility for demo purposes.',
                'contact_number' => '(083) 555-0103',
                'operating_hours' => 'Open 24/7 during emergencies',
            ],
            [
                'location' => 'Sample Labangal Coastal Watch Post',
                'name' => 'Sample Labangal Coastal Watch Post',
                'category' => 'emergency_facility',
                'description' => 'Fictional sample coastal watch post for demo purposes.',
                'contact_number' => '(083) 555-0104',
                'operating_hours' => 'Daily 6:00 AM - 10:00 PM',
            ],
            [
                'location' => 'Sample Dadiangas North Evacuation Hall',
                'name' => 'Sample Dadiangas North Admin Desk',
                'category' => 'government_office',
                'description' => 'Fictional sample admin desk for demo purposes.',
                'contact_number' => '(083) 555-0105',
                'operating_hours' => 'Mon-Fri 8:00 AM - 5:00 PM',
            ],
            [
                'location' => 'Sample Lagao Road Project Site',
                'name' => 'Sample Lagao Public Comfort Station',
                'category' => 'public_facility',
                'description' => 'Fictional sample public facility for demo purposes.',
                'contact_number' => null,
                'operating_hours' => 'Daily 6:00 AM - 8:00 PM',
            ],
        ];

        foreach ($facilities as $item) {
            $location = Location::where('name', $item['location'])->firstOrFail();
            unset($item['location']);
            $item['location_id'] = $location->id;

            Facility::updateOrCreate(['name' => $item['name']], $item);
        }
    }
}
