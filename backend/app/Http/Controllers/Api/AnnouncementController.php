<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'category' => ['sometimes', 'string', 'max:50'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Announcement::query()->with('source')->latest('id');

        // Public listings are always published-only; status is controlled by staff.
        $query->where('status', 'published');

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        return AnnouncementResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(Announcement $announcement): AnnouncementResource
    {
        abort_unless($announcement->status === 'published', 404);

        return new AnnouncementResource($announcement->load('source'));
    }
}
