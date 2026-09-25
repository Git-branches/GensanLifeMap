<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FacilityResource;
use App\Models\Facility;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'category' => ['sometimes', 'string', 'max:100'],
            'barangay' => ['sometimes', 'string', 'max:100'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Facility::query()->with('location')->latest('id');

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
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return FacilityResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(Facility $facility): FacilityResource
    {
        return new FacilityResource($facility->load('location'));
    }
}
