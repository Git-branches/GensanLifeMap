<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Facility extends Model
{
    protected $fillable = [
        'location_id',
        'name',
        'category',
        'description',
        'contact_number',
        'operating_hours',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
