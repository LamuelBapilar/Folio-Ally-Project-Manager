<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class NoteShare extends Model
{
    public const EXPIRES_IN_DAYS = 30;

    protected $fillable = [
        'sender_id', 'note_id', 'recipient_email', 'title', 'content', 'preview',
        'status', 'responded_at', 'expires_at',
    ];

    // the copy of the note never goes out in a response by accident
    protected $hidden = ['content'];

    protected $casts = [
        'content' => 'array',
        'responded_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }

    // shares sent to this person's email address
    public function scopeForRecipient(Builder $query, User $user): Builder
    {
        return $query->where('recipient_email', Str::lower($user->email));
    }

    // still waiting for an answer, and not past its expiry date
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending')->where('expires_at', '>', now());
    }

    // shares nobody answered in time are closed, and their copy of the note is thrown away
    public static function expireOld(): int
    {
        return static::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired', 'content' => null, 'preview' => null]);
    }
}