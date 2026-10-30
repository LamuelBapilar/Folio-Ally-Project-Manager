<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    // notifications that point at a board: they go away when the board does,
    // or when the person loses access to it
    public const BOARD_TYPES = [
        'story_due_soon',
        'story_due_today',
        'story_overdue',
        'story_assigned',
    ];

    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'board_id', 'story_id', 'invitation_id',
        'dedupe_key', 'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(BoardInvitation::class);
    }
}