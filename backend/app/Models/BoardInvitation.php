<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoardInvitation extends Model
{
    protected $fillable = ['board_id', 'invited_by', 'email', 'status'];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}