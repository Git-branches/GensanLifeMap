<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityReport extends Model
{
    protected $fillable = [
        'user_id',
        'location_id',
        'category',
        'title',
        'description',
        'photo_path',
        'latitude',
        'longitude',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Status history built from the moderation audit trail.
     *
     * Residents get the status, when it changed and the optional note the
     * reviewer chose to share. Staff views also get who made the change
     * (`$withActors`); that is never sent to residents.
     *
     * @return list<array{status: string, at: string|null, note: string|null, by?: string|null}>
     */
    public function timeline(bool $withActors = false): array
    {
        $first = ['status' => 'submitted', 'at' => $this->created_at?->toIso8601String(), 'note' => null];
        if ($withActors) {
            $first['by'] = $this->user?->name;
        }
        $events = [$first];

        AuditLog::query()
            ->when($withActors, fn ($query) => $query->with('user:id,name'))
            ->where('entity_type', 'community_report')
            ->where('entity_id', $this->id)
            ->orderBy('id')
            ->get()
            ->each(function (AuditLog $log) use (&$events, $withActors): void {
                $status = $log->new_values['status'] ?? null;
                if (! is_string($status)) {
                    return;
                }

                $event = [
                    'status' => $status,
                    'at' => $log->created_at?->toIso8601String(),
                    'note' => is_string($log->new_values['note'] ?? null) ? $log->new_values['note'] : null,
                ];
                if ($withActors) {
                    $event['by'] = $log->user?->name;
                }
                $events[] = $event;
            });

        return $events;
    }
}
