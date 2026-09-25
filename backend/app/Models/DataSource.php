<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSource extends Model
{
    protected $fillable = [
        'name',
        'source_type',
        'url',
        'description',
        'last_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'last_verified_at' => 'datetime',
        ];
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'source_id');
    }
}
