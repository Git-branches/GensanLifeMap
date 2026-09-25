<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\CommunityReport;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

// Fictional sample audit trail only.
class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.ph')->firstOrFail();
        $moderator = User::where('email', 'moderator@example.ph')->firstOrFail();
        $project = Project::where('title', 'Sample Lagao Road Concreting (Demo)')->first();
        $report = CommunityReport::where('title', 'Sample gutter overflow after demo rain')->first();
        $announcement = Announcement::where('title', 'Sample Road Works Advisory in Lagao (Demo)')->first();

        $logs = [
            [
                'user_id' => $admin->id,
                'action' => 'created',
                'entity_type' => 'project',
                'entity_id' => $project?->id,
                'old_values' => null,
                'new_values' => ['title' => $project?->title, 'status' => $project?->status],
            ],
            [
                'user_id' => $admin->id,
                'action' => 'updated',
                'entity_type' => 'project',
                'entity_id' => $project?->id,
                'old_values' => ['completion_percentage' => 30],
                'new_values' => ['completion_percentage' => 45],
            ],
            [
                'user_id' => $moderator->id,
                'action' => 'verified',
                'entity_type' => 'community_report',
                'entity_id' => $report?->id,
                'old_values' => ['status' => 'submitted'],
                'new_values' => ['status' => 'under_review'],
            ],
            [
                'user_id' => $moderator->id,
                'action' => 'rejected',
                'entity_type' => 'community_report',
                'entity_id' => null,
                'old_values' => ['status' => 'submitted'],
                'new_values' => ['status' => 'rejected', 'reason' => 'duplicate (demo)'],
            ],
            [
                'user_id' => $admin->id,
                'action' => 'published',
                'entity_type' => 'announcement',
                'entity_id' => $announcement?->id,
                'old_values' => ['status' => 'draft'],
                'new_values' => ['status' => 'published'],
            ],
            [
                'user_id' => $admin->id,
                'action' => 'archived',
                'entity_type' => 'announcement',
                'entity_id' => null,
                'old_values' => ['status' => 'published'],
                'new_values' => ['status' => 'archived'],
            ],
            [
                'user_id' => $moderator->id,
                'action' => 'resolved',
                'entity_type' => 'community_report',
                'entity_id' => null,
                'old_values' => ['status' => 'verified'],
                'new_values' => ['status' => 'resolved'],
            ],
            [
                'user_id' => $admin->id,
                'action' => 'deleted',
                'entity_type' => 'project',
                'entity_id' => null,
                'old_values' => ['title' => 'Sample demo draft project'],
                'new_values' => null,
            ],
        ];

        foreach ($logs as $data) {
            AuditLog::create($data);
        }
    }
}
