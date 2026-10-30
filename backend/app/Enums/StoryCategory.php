<?php

namespace App\Enums;

enum StoryCategory: string
{
    case Bug = 'bug';
    case Feature = 'feature';
    case Improvement = 'improvement';
    case Task = 'task';
    case Design = 'design';
    case Research = 'research';
    case Docs = 'docs';
}