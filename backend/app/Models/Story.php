<?php

namespace App\Models;

use App\Enums\StoryCategory;
use App\Enums\StoryPriority;
use App\Enums\StoryStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Story extends Model
{
    protected $fillable = [
        'board_id', 'title', 'description', 'status', 'priority', 'category',
        'due_date', 'progress', 'assigned_to', 'position',
    ];

    protected $casts = [
        'status' => StoryStatus::class,
        'priority' => StoryPriority::class,
        'category' => StoryCategory::class,
        'due_date' => 'date:Y-m-d',
        'progress' => 'integer',
        'assigned_to' => 'integer',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}