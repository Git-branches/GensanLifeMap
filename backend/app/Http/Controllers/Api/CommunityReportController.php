<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommunityReportRequest;
use App\Http\Requests\UpdateCommunityReportStatusRequest;
use App\Http\Resources\CommunityReportResource;
use App\Models\AuditLog;
use App\Models\CommunityReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'category' => ['sometimes', 'string', 'in:road,flooding,garbage,streetlight,accessibility,environment,other'],
            'status' => ['sometimes', 'string', 'in:submitted,under_review,verified,resolved,rejected'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = CommunityReport::query()->with(['user', 'location'])->latest('id');

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return CommunityReportResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(CommunityReport $communityReport): CommunityReportResource
    {
        return new CommunityReportResource($communityReport->load(['user', 'location']));
    }

    public function store(StoreCommunityReportRequest $request): JsonResponse
    {
        $data = $request->validated();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('reports', 'public');
        }

        $report = CommunityReport::create([
            'user_id' => $data['user_id'] ?? null,
            'location_id' => $data['location_id'],
            'category' => $data['category'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'photo_path' => $photoPath,
            // Status is always forced server-side; citizen input can never set it.
            'status' => 'submitted',
        ]);

        return (new CommunityReportResource($report->load(['user', 'location'])))
            ->response()
            ->setStatusCode(201);
    }

    public function updateStatus(
        UpdateCommunityReportStatusRequest $request,
        CommunityReport $communityReport
    ): CommunityReportResource {
        $oldStatus = $communityReport->status;
        $communityReport->update(['status' => $request->validated()['status']]);

        AuditLog::create([
            'user_id' => null, // No authenticated actor until auth phase lands.
            'action' => $communityReport->status,
            'entity_type' => 'community_report',
            'entity_id' => $communityReport->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $communityReport->status],
        ]);

        return new CommunityReportResource($communityReport->load(['user', 'location']));
    }
}
