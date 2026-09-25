<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'status' => $this->status,
            'budget' => $this->budget !== null ? (float) $this->budget : null,
            'contract_amount' => $this->contract_amount !== null ? (float) $this->contract_amount : null,
            'start_date' => $this->start_date?->toDateString(),
            'target_completion' => $this->target_completion?->toDateString(),
            'completion_percentage' => $this->completion_percentage,
            'location' => new LocationResource($this->whenLoaded('location')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
