<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteShare;
use App\Support\NoteDocument;
use App\Support\NoteText;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class NoteController extends Controller
{
    // the limits that keep your database small: change them here
    public const MAX_NOTES = 500;
    public const MAX_TEXT_CHARS = 60_000;
    private const MAX_CONTENT_BYTES = 200_000;
    private const PAGE = 100;

    public function index(Request $request)
    {
        $data = $request->validate([
            'folder' => ['nullable', 'string', 'max:20'],
            'q' => ['nullable', 'string', 'max:100'],
            'pinned' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'sort' => ['nullable', Rule::in(['updated', 'created', 'title'])],
        ]);

        // the list never loads whole documents: just a short preview of each
        $query = $request->user()->notes()
            ->select([
                'notes.id', 'notes.folder_id', 'notes.title', 'notes.is_pinned',
                'notes.shared_from', 'notes.created_at', 'notes.updated_at',
                DB::raw('LEFT(notes.content_text, 160) as preview'),
            ])
            ->with('folder:id,name');

        $folder = $data['folder'] ?? null;

        if ($folder === 'unfiled') {
            $query->whereNull('notes.folder_id');
        } elseif ($folder !== null && ctype_digit($folder)) {
            $query->where('notes.folder_id', (int) $folder);
        }

        if ($request->boolean('pinned')) {
            $query->where('notes.is_pinned', true);
        }

        if (! empty($data['q'])) {
            // % and _ typed by the person are searched for literally
            $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $data['q']);

            $query->where(fn ($w) => $w
                ->where('notes.title', 'like', "%{$term}%")
                ->orWhere('notes.content_text', 'like', "%{$term}%"));
        }

        if (! empty($data['from'])) {
            $query->whereDate('notes.updated_at', '>=', $data['from']);
        }

        if (! empty($data['to'])) {
            $query->whereDate('notes.updated_at', '<=', $data['to']);
        }

        // pinned notes always come first
        $query->orderByDesc('notes.is_pinned');

        match ($data['sort'] ?? 'updated') {
            'created' => $query->orderByDesc('notes.created_at'),
            'title' => $query->orderBy('notes.title'),
            default => $query->orderByDesc('notes.updated_at'),
        };

        $query->orderByDesc('notes.id');

        $notes = $query->limit(self::PAGE + 1)->get();

        return [
            'data' => $notes->take(self::PAGE)->values(),
            'has_more' => $notes->count() > self::PAGE,
        ];
    }

    public function show(Request $request, string $id)
    {
        $note = $request->user()->notes()->with('folder:id,name')->findOrFail($id);

        return $this->full($note);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'folder_id' => [
                'nullable', 'integer',
                Rule::exists('note_folders', 'id')->where('user_id', $user->id),
            ],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        if ($user->notes()->count() >= self::MAX_NOTES) {
            throw ValidationException::withMessages([
                'title' => 'You have reached the limit of '.self::MAX_NOTES.' notes. Delete some to add more.',
            ]);
        }

        $note = $user->notes()->create([
            'folder_id' => $data['folder_id'] ?? null,
            'title' => trim($data['title'] ?? ''),
        ])->fresh('folder');

        return response()->json($this->full($note), 201);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $note = $user->notes()->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],

            // Do NOT add a "content.type" rule here. Laravel then returns only the
            // keys that have their own rule, and the body of the note is lost.
            // The document is checked inside validDocument() instead.
            'content' => ['sometimes', 'nullable', 'array', $this->validDocument()],

            'folder_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('note_folders', 'id')->where('user_id', $user->id),
            ],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $edited = false;

        if (array_key_exists('title', $data)) {
            $note->title = trim($data['title'] ?? '');
            $edited = true;
        }

        if (array_key_exists('content', $data)) {
            // rebuilt from the allow-list, so nothing unsafe is ever stored
            $document = NoteDocument::clean($data['content']);

            $note->content = $document;
            $note->content_text = $document
                ? mb_substr(NoteText::fromDocument($document), 0, self::MAX_TEXT_CHARS)
                : null;
            $edited = true;
        }

        if (array_key_exists('folder_id', $data)) {
            $note->folder_id = $data['folder_id'];
        }

        if (array_key_exists('is_pinned', $data)) {
            $note->is_pinned = $data['is_pinned'];
        }

        // pinning or moving a note is not an edit, so it keeps its "last edited" time
        if (! $edited) {
            $note->timestamps = false;
        }

        $note->save();

        return $this->summary($note->load('folder:id,name'));
    }

    public function destroy(Request $request, string $id)
    {
        $note = $request->user()->notes()->findOrFail($id);

        DB::transaction(function () use ($note) {
            // a note that is gone can no longer be accepted by anyone
            NoteShare::where('note_id', $note->id)->where('status', 'pending')->delete();

            $note->delete();
        });

        return response()->noContent();
    }

    // the document must be an editor document, and not too big
    private function validDocument(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if ($value === null) {
                return;
            }

            if (! is_array($value) || ($value['type'] ?? null) !== 'doc') {
                $fail('This note could not be saved because its content is not valid.');

                return;
            }

            if (strlen((string) json_encode($value)) > self::MAX_CONTENT_BYTES) {
                $fail('This note is too long. Split it into two notes.');
            }
        };
    }

    private function summary(Note $note): array
    {
        return [
            'id' => $note->id,
            'folder_id' => $note->folder_id,
            'folder' => $note->folder ? ['id' => $note->folder->id, 'name' => $note->folder->name] : null,
            'title' => $note->title,
            'is_pinned' => $note->is_pinned,
            'shared_from' => $note->shared_from,
            'preview' => Str::limit((string) $note->content_text, 160),
            'created_at' => $note->created_at,
            'updated_at' => $note->updated_at,
        ];
    }

    private function full(Note $note): array
    {
        return $this->summary($note) + ['content' => $note->content];
    }
}