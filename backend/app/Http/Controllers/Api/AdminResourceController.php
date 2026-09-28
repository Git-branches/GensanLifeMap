<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\DataSource;
use App\Models\Facility;
use App\Models\Location;
use App\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminResourceController extends Controller
{
    private const RESOURCES = [
        'locations' => [
            'model' => Location::class,
            'resource' => \App\Http\Resources\LocationResource::class,
            'search' => ['name', 'address', 'barangay'],
        ],
        'projects' => [
            'model' => Project::class,
            'resource' => \App\Http\Resources\ProjectResource::class,
            'search' => ['title', 'description'],
        ],
        'facilities' => [
            'model' => Facility::class,
            'resource' => \App\Http\Resources\FacilityResource::class,
            'search' => ['name', 'description', 'category'],
        ],
        'announcements' => [
            'model' => Announcement::class,
            'resource' => \App\Http\Resources\AnnouncementResource::class,
            'search' => ['title', 'content'],
        ],
        'data-sources' => [
            'model' => DataSource::class,
            'resource' => \App\Http\Resources\DataSourceResource::class,
            'search' => ['name', 'description'],
        ],
    ];

    public function index(Request $request, string $resource)
    {
        $config = $this->config($resource);
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'string', 'max:30'],
            'category' => ['sometimes', 'string', 'max:100'],
            'barangay' => ['sometimes', 'string', 'max:100'],
            'location_type' => ['sometimes', 'string', 'max:50'],
            'source_type' => ['sometimes', 'string', Rule::in(['official', 'public_document', 'community', 'system_generated'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);
        $model = $config['model'];
        $query = $model::query()->latest('id');
        if (in_array($resource, ['projects', 'facilities'], true)) $query->with('location');
        if ($resource === 'announcements') $query->with('source');
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $columns = $config['search'];
            $query->where(fn ($builder) => collect($columns)->each(fn (string $column, int $index) => $index === 0
                ? $builder->where($column, 'like', "%{$search}%")
                : $builder->orWhere($column, 'like', "%{$search}%")));
        }
        if (! empty($filters['status']) && in_array($resource, ['projects', 'announcements'], true)) $query->where('status', $filters['status']);
        if (! empty($filters['category']) && in_array($resource, ['projects', 'facilities', 'announcements'], true)) $query->where('category', $filters['category']);
        if (! empty($filters['source_type']) && $resource === 'data-sources') $query->where('source_type', $filters['source_type']);
        if (! empty($filters['location_type']) && $resource === 'locations') $query->where('location_type', $filters['location_type']);
        if (! empty($filters['barangay']) && in_array($resource, ['projects', 'facilities'], true)) {
            $query->whereHas('location', fn ($builder) => $builder->where('barangay', $filters['barangay']));
        } elseif (! empty($filters['barangay']) && $resource === 'locations') {
            $query->where('barangay', $filters['barangay']);
        }

        $resourceClass = $config['resource'];
        return $resourceClass::collection($query->paginate($filters['per_page'] ?? 20));
    }

    public function store(Request $request, string $resource)
    {
        $config = $this->config($resource);
        $data = $request->validate($this->rulesFor($resource));
        if ($resource === 'announcements' && $data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $modelClass = $config['model'];
        $entity = DB::transaction(function () use ($request, $resource, $modelClass, $data): Model {
            $entity = $modelClass::create($data);
            $this->audit($request, 'created', $resource, $entity->id, null, $data);
            return $entity;
        });
        $resourceClass = $config['resource'];
        return $resourceClass::make($this->withRelations($entity, $resource))->response()->setStatusCode(201);
    }

    public function show(string $resource, int $id)
    {
        $config = $this->config($resource);
        $modelClass = $config['model'];
        $entity = $this->withRelations($modelClass::query()->findOrFail($id), $resource);
        $resourceClass = $config['resource'];
        return $resourceClass::make($entity);
    }

    public function update(Request $request, string $resource, int $id)
    {
        $config = $this->config($resource);
        $data = $request->validate($this->rulesFor($resource));
        $modelClass = $config['model'];
        $entity = $modelClass::query()->findOrFail($id);
        $oldValues = $entity->only(array_keys($data));
        if ($resource === 'announcements' && $data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = $entity->published_at ?? now();
        }

        DB::transaction(function () use ($request, $resource, $entity, $data, $oldValues): void {
            $entity->update($data);
            $action = $resource === 'announcements' && $oldValues['status'] !== $entity->status
                ? $entity->status
                : 'updated';
            $this->audit($request, $action, $resource, $entity->id, $oldValues, $entity->only(array_keys($data)));
        });
        $resourceClass = $config['resource'];
        return $resourceClass::make($this->withRelations($entity->fresh(), $resource));
    }

    public function destroy(Request $request, string $resource, int $id)
    {
        $config = $this->config($resource);
        $modelClass = $config['model'];
        $entity = $modelClass::query()->findOrFail($id);

        if ($resource === 'locations') {
            abort_if(
                $entity->projects()->exists() || $entity->facilities()->exists() || $entity->communityReports()->exists(),
                409,
                'This location is linked to projects, facilities, or community reports and cannot be deleted.'
            );
        }
        if ($resource === 'data-sources') {
            abort_if($entity->announcements()->exists(), 409, 'This data source is linked to announcements and cannot be deleted.');
        }

        $oldValues = $entity->getAttributes();
        DB::transaction(function () use ($request, $resource, $entity, $oldValues): void {
            $entity->delete();
            $this->audit($request, 'deleted', $resource, $entity->id, $oldValues, null);
        });

        return response()->noContent();
    }

    private function config(string $resource): array
    {
        abort_unless(isset(self::RESOURCES[$resource]), 404, 'Unknown management resource.');
        return self::RESOURCES[$resource];
    }

    private function rulesFor(string $resource): array
    {
        return match ($resource) {
            'locations' => [
                'name' => ['required', 'string', 'max:255'],
                'address' => ['nullable', 'string', 'max:255'],
                'barangay' => ['nullable', 'string', 'max:100'],
                'location_type' => ['required', 'string', 'max:50'],
                'latitude' => ['nullable', 'numeric', 'between:-90,90'],
                'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            ],
            'projects' => [
                'location_id' => ['required', 'integer', 'exists:locations,id'],
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string', 'max:10000'],
                'category' => ['nullable', 'string', 'max:100'],
                'status' => ['required', 'string', Rule::in(['planned', 'procurement', 'ongoing', 'completed', 'delayed', 'cancelled'])],
                'budget' => ['nullable', 'numeric', 'min:0'],
                'contract_amount' => ['nullable', 'numeric', 'min:0'],
                'start_date' => ['nullable', 'date'],
                'target_completion' => ['nullable', 'date'],
                'completion_percentage' => ['required', 'integer', 'between:0,100'],
            ],
            'facilities' => [
                'location_id' => ['required', 'integer', 'exists:locations,id'],
                'name' => ['required', 'string', 'max:255'],
                'category' => ['nullable', 'string', 'max:100'],
                'description' => ['nullable', 'string', 'max:10000'],
                'contact_number' => ['nullable', 'string', 'max:50'],
                'operating_hours' => ['nullable', 'string', 'max:255'],
            ],
            'announcements' => [
                'title' => ['required', 'string', 'max:255'],
                'content' => ['required', 'string', 'max:20000'],
                'category' => ['required', 'string', 'max:50'],
                'source_id' => ['nullable', 'integer', 'exists:data_sources,id'],
                'published_at' => ['nullable', 'date'],
                'expires_at' => ['nullable', 'date', 'after_or_equal:published_at'],
                'status' => ['required', 'string', Rule::in(['draft', 'published', 'archived'])],
            ],
            'data-sources' => [
                'name' => ['required', 'string', 'max:255'],
                'source_type' => ['required', 'string', Rule::in(['official', 'public_document', 'community', 'system_generated'])],
                'url' => ['nullable', 'url', 'max:2048'],
                'description' => ['nullable', 'string', 'max:10000'],
                'last_verified_at' => ['nullable', 'date'],
            ],
            default => abort(404, 'Unknown management resource.'),
        };
    }

    private function withRelations(Model $entity, string $resource): Model
    {
        return match ($resource) {
            'projects', 'facilities' => $entity->load('location'),
            'announcements' => $entity->load('source'),
            default => $entity,
        };
    }

    private function audit(Request $request, string $action, string $resource, int $id, ?array $old, ?array $new): void
    {
        $entityType = [
            'locations' => 'location',
            'projects' => 'project',
            'facilities' => 'facility',
            'announcements' => 'announcement',
            'data-sources' => 'data_source',
        ][$resource];
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $id,
            'old_values' => $old,
            'new_values' => $new,
        ]);
    }
}
