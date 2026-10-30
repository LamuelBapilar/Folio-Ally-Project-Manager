<?php

namespace App\Enums;

enum StoryPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
}