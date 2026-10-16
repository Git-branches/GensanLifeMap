<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityReportResource extends JsonResource
{
    /** @var list<array{status: string, at: string|null}>|null */
    private ?array $timeline = null;

    /**
     * Attach the status history (detail view only).
     *
     * @param  list<array{status: string, at: string|null}>  $timeline
     */
    public function withTimeline(array $timeline): static
    {
        $this->timeline = $timeline;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'title' => $this->title,
            'description' => $this->description,
            'photo_path' => $this->photo_path,
            // Absolute URL built from the current request host, so it works
            // wherever the API is served (requires `php artisan storage:link`).
            'photo_url' => $this->photo_path ? asset('storage/'.$this->photo_path) : null,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'status' => $this->status,
            // Only safe, non-sensitive user info. Never email or password hash.
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            'location' => new LocationResource($this->whenLoaded('location')),
            'timeline' => $this->when($this->timeline !== null, fn () => $this->timeline),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
