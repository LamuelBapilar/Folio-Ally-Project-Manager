<?php

namespace App\Support;

class NoteText
{
    // after these nodes a space is added, so words from different lines don't run together
    private const BLOCKS = [
        'paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem', 'taskItem',
        'bulletList', 'orderedList', 'taskList', 'horizontalRule', 'hardBreak',
    ];

    public static function fromDocument(?array $document): string
    {
        if (! $document) {
            return '';
        }

        return trim(preg_replace('/\s+/u', ' ', self::walk($document, 0)) ?? '');
    }

    private static function walk(array $node, int $depth): string
    {
        // guard against absurdly nested content
        if ($depth > 50) {
            return '';
        }

        $text = '';
        $type = $node['type'] ?? '';

        if ($type === 'text') {
            $text .= (string) ($node['text'] ?? '');
        }

        if (is_array($node['content'] ?? null)) {
            foreach ($node['content'] as $child) {
                if (is_array($child)) {
                    $text .= self::walk($child, $depth + 1);
                }
            }
        }

        return in_array($type, self::BLOCKS, true) ? $text.' ' : $text;
    }
}