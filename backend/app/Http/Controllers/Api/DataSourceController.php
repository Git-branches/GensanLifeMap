<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DataSourceResource;
use App\Models\DataSource;
use Illuminate\Http\Request;

class DataSourceController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'source_type' => ['sometimes', 'string', 'in:official,public_document,community,system_generated'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = DataSource::query()->latest('id');

        if (! empty($filters['source_type'])) {
            $query->where('source_type', $filters['source_type']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return DataSourceResource::collection(
            $query->paginate($filters['per_page'] ?? 15)
        );
    }

    public function show(DataSource $dataSource): DataSourceResource
    {
        return new DataSourceResource($dataSource);
    }
}
