<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            DataSourceSeeder::class,
            LocationSeeder::class,
            ProjectSeeder::class,
            FacilitySeeder::class,
            CommunityReportSeeder::class,
            AnnouncementSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}
