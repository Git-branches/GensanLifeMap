<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

// Fictional sample coordinates around General Santos City (approx. 6.11, 125.17).
class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'name' => 'Sample Lagao Road Project Site',
                'address' => 'Sample National Highway cor. Sample St., Lagao',
                'barangay' => 'Lagao',
                'location_type' => 'project_site',
                'latitude' => 6.1161000,
                'longitude' => 125.1750000,
            ],
            [
                'name' => 'Sample Calumpang Riverside Area',
                'address' => 'Sample Riverside Rd., Calumpang',
                'barangay' => 'Calumpang',
                'location_type' => 'community_area',
                'latitude' => 6.1055000,
                'longitude' => 125.1660000,
            ],
            [
                'name' => 'Sample San Isidro Health Center Site',
                'address' => 'Sample Health Ave., San Isidro',
                'barangay' => 'San Isidro',
                'location_type' => 'facility',
                'latitude' => 6.1220000,
                'longitude' => 125.1800000,
            ],
            [
                'name' => 'Sample Apopong Elementary School Site',
                'address' => 'Sample School Rd., Apopong',
                'barangay' => 'Apopong',
                'location_type' => 'facility',
                'latitude' => 6.1350000,
                'longitude' => 125.1650000,
            ],
            [
                'name' => 'Sample Dadiangas North Evacuation Hall',
                'address' => 'Sample Hall Compound, Dadiangas North',
                'barangay' => 'Dadiangas North',
                'location_type' => 'government_office',
                'latitude' => 6.1128000,
                'longitude' => 125.1717000,
            ],
            [
                'name' => 'Sample Bula Drainage Channel',
                'address' => 'Sample Drainage Rd., Bula',
                'barangay' => 'Bula',
                'location_type' => 'community_area',
                'latitude' => 6.0980000,
                'longitude' => 125.1720000,
            ],
            [
                'name' => 'Sample Labangal Coastal Watch Post',
                'address' => 'Sample Coastal Rd., Labangal',
                'barangay' => 'Labangal',
                'location_type' => 'facility',
                'latitude' => 6.0900000,
                'longitude' => 125.1580000,
            ],
            [
                'name' => 'Sample Fatima Streetlight Pilot Zone',
                'address' => 'Sample Pilot St., Fatima',
                'barangay' => 'Fatima',
                'location_type' => 'other',
                'latitude' => 6.1280000,
                'longitude' => 125.1900000,
            ],
        ];

        foreach ($locations as $data) {
            Location::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}
