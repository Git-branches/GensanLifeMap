<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Fictional sample accounts only. Not real persons.
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Sample Admin', 'email' => 'admin@example.ph', 'role' => 'admin'],
            ['name' => 'Sample Moderator', 'email' => 'moderator@example.ph', 'role' => 'moderator'],
            ['name' => 'Sample Citizen One', 'email' => 'citizen1@example.ph', 'role' => 'citizen'],
            ['name' => 'Sample Citizen Two', 'email' => 'citizen2@example.ph', 'role' => 'citizen'],
            ['name' => 'Sample Citizen Three', 'email' => 'citizen3@example.ph', 'role' => 'citizen'],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'role' => $data['role'],
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
