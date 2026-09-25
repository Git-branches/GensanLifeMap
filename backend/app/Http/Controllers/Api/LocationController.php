<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'barangay' => ['sometimes', 'string', 'max:100'],
            'location_type' => ['sometimes', 'string', 'max:50'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Location::query()->latest('id');

        if (! empty($filters['barangay'])) {
            $query->where('barangay', $filters['barangay']);
        }

        if (! empty($filters['location_type'])) {
            $query->where('location_type', $filters['location_type']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('barangay', 'like', "%{$search}%");
            });
        }

        return LocationResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(Location $location): LocationResource
    {
        return new LocationResource($location);
    }
}
