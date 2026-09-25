<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', 'in:planned,procurement,ongoing,completed,delayed,cancelled'],
            'category' => ['sometimes', 'string', 'max:100'],
            'barangay' => ['sometimes', 'string', 'max:100'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Project::query()->with('location')->latest('id');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['barangay'])) {
            $barangay = $filters['barangay'];
            $query->whereHas('location', fn ($q) => $q->where('barangay', $barangay));
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return ProjectResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(Project $project): ProjectResource
    {
        return new ProjectResource($project->load('location'));
    }
}
