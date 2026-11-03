<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Rebuilds a note from an allow-list: only the formatting the editor offers survives,
 * and every value that could end up in a style or a link is checked. Anything else is
 * dropped and written to the log, so it is never stored or shown to another person.
 */
class NoteDocument
{
    private const MAX_DEPTH = 20;
    private const MAX_NODES = 20000;
    private const ALIGNMENTS = ['left', 'center', 'right', 'justify'];
    private const LIST_TYPES = ['1', 'a', 'A', 'i', 'I'];

    private int $count = 0;

    /** @var array<string, int> */
    private array $dropped = [];

    public static function clean(?array $document): ?array
    {
        return (new self)->run($document);
    }

    private function run(?array $document): ?array
    {
        if (! $document || ($document['type'] ?? null) !== 'doc') {
            return null;
        }

        $content = $this->nodes($document['content'] ?? null, 1);

        if ($this->dropped) {
            Log::warning('A note had parts the editor does not support. They were removed.', $this->dropped);
        }

        return $content ? ['type' => 'doc', 'content' => $content] : null;
    }

    private function nodes(mixed $nodes, int $depth): array
    {
        if (! is_array($nodes) || ! array_is_list($nodes)) {
            return [];
        }

        if ($depth > self::MAX_DEPTH) {
            $this->drop('too-deep');

            return [];
        }

        $clean = [];

        foreach ($nodes as $node) {
            if (++$this->count > self::MAX_NODES) {
                $this->drop('too-many-parts');
                break;
            }

            $result = is_array($node) ? $this->node($node, $depth) : null;

            if ($result !== null) {
                $clean[] = $result;
            }
        }

        return $clean;
    }

    private function node(array $node, int $depth): ?array
    {
        $type = $node['type'] ?? null;
        $attrs = is_array($node['attrs'] ?? null) ? $node['attrs'] : [];

        if (! is_string($type)) {
            return $this->drop('no-type');
        }

        return match ($type) {
            'text' => $this->text($node),
            'hardBreak', 'horizontalRule' => ['type' => $type],
            'paragraph' => $this->textBlock($type, $this->only($attrs, ['textAlign']), $node, $depth),
            'heading' => $this->textBlock($type, $this->only($attrs, ['level', 'textAlign']), $node, $depth),
            'codeBlock' => $this->codeBlock($this->only($attrs, ['language']), $node, $depth),
            'blockquote' => $this->blockquote($node, $depth),
            'bulletList' => $this->list($type, [], 'listItem', $node, $depth),
            'orderedList' => $this->list($type, $this->only($attrs, ['start', 'type']), 'listItem', $node, $depth),
            'taskList' => $this->list($type, [], 'taskItem', $node, $depth),
            'listItem' => $this->item($type, [], $node, $depth),
            'taskItem' => $this->item($type, $this->only($attrs, ['checked']), $node, $depth),
            default => $this->drop($type),
        };
    }

    private function build(string $type, array $attrs, array $children): array
    {
        $out = ['type' => $type];

        if ($attrs) {
            $out['attrs'] = $attrs;
        }

        if ($children) {
            $out['content'] = $children;
        }

        return $out;
    }

    // paragraphs and headings hold only text and line breaks
    private function textBlock(string $type, array $attrs, array $node, int $depth): array
    {
        $children = array_values(array_filter(
            $this->nodes($node['content'] ?? null, $depth + 1),
            fn (array $child) => in_array($child['type'], ['text', 'hardBreak'], true)
        ));

        return $this->build($type, $attrs, $children);
    }

    // code blocks hold plain text only: no bold, links, or colors
    private function codeBlock(array $attrs, array $node, int $depth): array
    {
        $children = [];

        foreach ($this->nodes($node['content'] ?? null, $depth + 1) as $child) {
            if ($child['type'] === 'text') {
                $children[] = ['type' => 'text', 'text' => $child['text']];
            }
        }

        return $this->build('codeBlock', $attrs, $children);
    }

    private function blockquote(array $node, int $depth): array
    {
        $children = $this->nodes($node['content'] ?? null, $depth + 1);

        // an empty quote would be invalid, so it gets one empty paragraph
        return $this->build('blockquote', [], $children ?: [['type' => 'paragraph']]);
    }

    private function list(string $type, array $attrs, string $itemType, array $node, int $depth): ?array
    {
        $items = array_values(array_filter(
            $this->nodes($node['content'] ?? null, $depth + 1),
            fn (array $child) => $child['type'] === $itemType
        ));

        // a list with nothing in it is removed
        return $items ? $this->build($type, $attrs, $items) : null;
    }

    private function item(string $type, array $attrs, array $node, int $depth): array
    {
        $children = $this->nodes($node['content'] ?? null, $depth + 1);

        return $this->build($type, $attrs, $children ?: [['type' => 'paragraph']]);
    }

    private function text(array $node): ?array
    {
        $text = $node['text'] ?? null;

        if (! is_string($text)) {
            return null;
        }

        // control characters have no place in a note, but tabs and line breaks stay
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);

        if ($text === null || $text === '') {
            return null;
        }

        $marks = $this->marks($node['marks'] ?? null);

        return $marks
            ? ['type' => 'text', 'text' => $text, 'marks' => $marks]
            : ['type' => 'text', 'text' => $text];
    }

    // the order of the marks is kept exactly as it came in: the editor checks it
    private function marks(mixed $marks): array
    {
        if (! is_array($marks) || ! array_is_list($marks)) {
            return [];
        }

        $clean = [];
        $seen = [];

        foreach ($marks as $mark) {
            $type = is_array($mark) ? ($mark['type'] ?? null) : null;

            if (! is_string($type) || isset($seen[$type])) {
                continue;
            }

            $attrs = is_array($mark['attrs'] ?? null) ? $mark['attrs'] : [];

            $result = match ($type) {
                'bold', 'italic', 'strike', 'underline', 'code' => ['type' => $type],
                'link' => $this->link($attrs),
                'textStyle' => $this->textStyle($attrs),
                default => $this->drop('mark:'.$type),
            };

            if ($result !== null) {
                $seen[$type] = true;
                $clean[] = $result;
            }
        }

        return $clean;
    }

    private function link(array $attrs): ?array
    {
        $href = $this->href($attrs['href'] ?? null);

        if ($href === null) {
            // the text stays, only the unsafe link is removed
            return $this->drop('unsafe-link');
        }

        $clean = ['href' => $href];

        if (array_key_exists('target', $attrs)) {
            $clean['target'] = '_blank';
        }

        if (array_key_exists('rel', $attrs)) {
            $clean['rel'] = 'noopener noreferrer nofollow';
        }

        if (array_key_exists('class', $attrs)) {
            $clean['class'] = null;
        }

        return ['type' => 'link', 'attrs' => $clean];
    }

    private function textStyle(array $attrs): ?array
    {
        $clean = $this->only($attrs, ['fontFamily', 'fontSize', 'color', 'backgroundColor', 'lineHeight']);

        // a style with nothing set does nothing
        if (! array_filter($clean, fn ($value) => $value !== null)) {
            return null;
        }

        return ['type' => 'textStyle', 'attrs' => $clean];
    }

    // keeps only the attributes that were present, each one checked
    private function only(array $attrs, array $keys): array
    {
        $clean = [];

        foreach ($keys as $key) {
            if (array_key_exists($key, $attrs)) {
                $clean[$key] = $this->value($key, $attrs[$key]);
            }
        }

        return $clean;
    }

    private function value(string $key, mixed $value): mixed
    {
        return match ($key) {
            'textAlign' => in_array($value, self::ALIGNMENTS, true) ? $value : null,
            'level' => in_array($value, [1, 2, 3], true) ? $value : 1,
            'start' => is_int($value) && $value >= 1 && $value <= 1_000_000 ? $value : 1,
            'type' => in_array($value, self::LIST_TYPES, true) ? $value : null,
            'checked' => $value === true,
            'language' => is_string($value) && preg_match('/^[A-Za-z0-9_+#.\-]{1,30}$/', $value) ? $value : null,
            'color', 'backgroundColor' => $this->color($value),
            'fontSize' => $this->fontSize($value),
            'fontFamily' => $this->fontFamily($value),
            'lineHeight' => $this->lineHeight($value),
            default => null,
        };
    }

    private function color(mixed $value): ?string
    {
        if (! is_string($value) || strlen($value) > 60) {
            return null;
        }

        $value = trim($value);

        $valid = preg_match('/^#[0-9a-f]{3,8}$/i', $value)
            || preg_match('/^[a-z]{3,20}$/i', $value)
            || preg_match('/^rgba?\(\s*\d{1,3}\s*(?:,\s*\d{1,3}\s*){2}(?:,\s*[\d.]+%?\s*)?\)$/i', $value)
            || preg_match('/^rgba?\(\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}(?:\s*\/\s*[\d.]+%?)?\s*\)$/i', $value)
            || preg_match('/^hsla?\(\s*[\d.]+(?:deg)?\s*[, ]\s*[\d.]+%\s*[, ]\s*[\d.]+%(?:\s*[,\/]\s*[\d.]+%?)?\s*\)$/i', $value);

        return $valid ? $value : null;
    }

    private function fontSize(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if (! preg_match('/^(\d{1,3}(?:\.\d{1,2})?)(?:px|pt|em|rem|%)$/', $value, $m) || (float) $m[1] > 500) {
            return null;
        }

        return $value;
    }

    private function fontFamily(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return preg_match('/^[\w\s,"\'\-]{1,120}$/u', $value) ? $value : null;
    }

    private function lineHeight(mixed $value): ?string
    {
        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return preg_match('/^\d{1,3}(?:\.\d{1,3})?(?:px|em|rem|%)?$/', $value) ? $value : null;
    }

    // only web and email addresses: no javascript:, data:, or file: links
    private function href(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || strlen($value) > 2000 || preg_match('/[\s\x00-\x1f\x7f]/', $value)) {
            return null;
        }

        if (preg_match('#^https?://#i', $value)) {
            $host = parse_url($value, PHP_URL_HOST);

            return is_string($host) && $host !== '' ? $value : null;
        }

        return preg_match('/^mailto:\S+$/i', $value) ? $value : null;
    }

    private function drop(string $what): ?array
    {
        $key = mb_substr(preg_replace('/[^\w:.\-]/u', '?', $what) ?? '?', 0, 40);
        $this->dropped[$key] = ($this->dropped[$key] ?? 0) + 1;

        return null;
    }
}

