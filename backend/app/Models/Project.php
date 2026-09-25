<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    protected $fillable = [
        'location_id',
        'title',
        'description',
        'category',
        'status',
        'budget',
        'contract_amount',
        'start_date',
        'target_completion',
        'completion_percentage',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'contract_amount' => 'decimal:2',
            'start_date' => 'date',
            'target_completion' => 'date',
            'completion_percentage' => 'integer',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
