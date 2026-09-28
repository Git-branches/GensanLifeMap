<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommunityReportResource;
use App\Http\Resources\UserResource;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\CommunityReport;
use App\Models\Facility;
use App\Models\Location;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $isAdministrator = $request->user()->role === User::ROLE_ADMIN;

        return response()->json([
            'data' => [
                'locations' => Location::count(),
                'projects' => Project::count(),
                'facilities' => Facility::count(),
                'pending_reports' => CommunityReport::whereIn('status', ['submitted', 'under_review'])->count(),
                'announcements' => Announcement::where('status', 'published')->count(),
                'registered_users' => $isAdministrator ? User::count() : null,
                'recent_reports' => CommunityReport::with(['user:id,name', 'location:id,name'])
                    ->latest('id')->limit(6)->get(),
                'recent_activity' => $isAdministrator ? AuditLog::with('user:id,name')
                    ->latest('id')->limit(8)->get()
                    ->map(fn (AuditLog $log): array => $this->auditEntry($log)) : [],
            ],
        ]);
    }

    public function reports(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', 'in:submitted,under_review,verified,resolved,rejected'],
            'category' => ['sometimes', 'string', 'in:road,flooding,garbage,streetlight,accessibility,environment,other'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = CommunityReport::with(['user:id,name', 'location'])->latest('id');
        if (! empty($filters['status'])) $query->where('status', $filters['status']);
        if (! empty($filters['category'])) $query->where('category', $filters['category']);
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(fn ($builder) => $builder->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%"));
        }

        return CommunityReportResource::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function report(Request $request, CommunityReport $communityReport): CommunityReportResource
    {
        return new CommunityReportResource($communityReport->load(['user:id,name', 'location']));
    }

    public function users(Request $request)
    {
        $filters = $request->validate([
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);
        $query = User::query()->latest('id');
        if (! empty($filters['role'])) $query->where('role', $filters['role']);
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(fn ($builder) => $builder->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        return UserResource::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['role' => ['required', 'string', Rule::in(User::ROLES)]]);
        abort_if($request->user()->is($user), 422, 'You cannot change your own role.');

        $old = ['role' => $user->role];
        abort_if($user->role === User::ROLE_ADMIN && $data['role'] !== User::ROLE_ADMIN && User::where('role', User::ROLE_ADMIN)->count() <= 1, 422, 'The final administrator role cannot be removed.');
        DB::transaction(function () use ($request, $user, $data, $old): void {
            $user->update(['role' => $data['role']]);
            $this->writeAudit($request, 'role_updated', 'user', $user->id, $old, ['role' => $user->role]);
        });

        return response()->json(['data' => ['user' => new UserResource($user->fresh())], 'message' => 'User role updated.']);
    }

    public function auditLogs(Request $request)
    {
        $filters = $request->validate([
            'entity_type' => ['sometimes', 'string', 'max:100'],
            'action' => ['sometimes', 'string', 'max:50'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = AuditLog::with('user:id,name')->latest('id');
        if (! empty($filters['entity_type'])) $query->where('entity_type', $filters['entity_type']);
        if (! empty($filters['action'])) $query->where('action', $filters['action']);
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(fn ($builder) => $builder->where('action', 'like', "%{$search}%")
                ->orWhere('entity_type', 'like', "%{$search}%"));
        }

        $paginator = $query->paginate($filters['per_page'] ?? 25);
        $paginator->getCollection()->transform(fn (AuditLog $log): array => $this->auditEntry($log));
        return $paginator;
    }

    private function auditEntry(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'entity_type' => $log->entity_type,
            'entity_id' => $log->entity_id,
            'actor' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }

    private function writeAudit(Request $request, string $action, string $type, int $id, ?array $old, ?array $new): void
    {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'entity_type' => $type,
            'entity_id' => $id,
            'old_values' => $old,
            'new_values' => $new,
        ]);
    }
}
