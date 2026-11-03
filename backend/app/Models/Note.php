<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Note extends Model
{
    protected $fillable = [
        'user_id', 'folder_id', 'title', 'content', 'content_text', 'is_pinned', 'shared_from',
    ];

    // the plain-text copy is only for searching: it never goes out in responses
    protected $hidden = ['content_text'];

    protected $casts = [
        'content' => 'array',
        'is_pinned' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(NoteFolder::class, 'folder_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(NoteShare::class);
    }
}