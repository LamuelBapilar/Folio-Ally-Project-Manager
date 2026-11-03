<?php

namespace App\Http\Controllers;

use App\Models\NoteShare;
use App\Services\Notifier;
use App\Support\NoteDocument;
use App\Support\NoteText;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReceivedShareController extends Controller
{
    // what the "review shared note" window shows
    public function show(Request $request, string $id)
    {
        NoteShare::expireOld();

        $share = NoteShare::forRecipient($request->user())
            ->with('sender:id,name,email')
            ->findOrFail($id);

        return [
            'id' => $share->id,
            'status' => $share->status,
            'title' => $share->title,
            'preview' => $share->preview,
            'created_at' => $share->created_at,
            'expires_at' => $share->expires_at,
            'sender' => ['name' => $share->sender->name, 'email' => $share->sender->email],
        ];
    }

    // makes the recipient's own copy of the note
    public function accept(Request $request, string $id)
    {
        $user = $request->user();

        $data = $request->validate([
            'folder_id' => [
                'nullable', 'integer',
                Rule::exists('note_folders', 'id')->where('user_id', $user->id),
            ],
        ]);

        NoteShare::expireOld();

        [$note, $share] = DB::transaction(function () use ($user, $id, $data) {
            $share = NoteShare::forRecipient($user)->with('sender:id,name')->lockForUpdate()->findOrFail($id);

            $this->ensureOpen($share);

            if ($user->notes()->count() >= NoteController::MAX_NOTES) {
                throw ValidationException::withMessages([
                    'note' => 'You have reached the limit of '.NoteController::MAX_NOTES.' notes. Delete some to save this one.',
                ]);
            }

            $document = NoteDocument::clean($share->content);

            $note = $user->notes()->create([
                'folder_id' => $data['folder_id'] ?? null,
                'title' => $share->title,
                'content' => $document,
                'content_text' => $document
                    ? mb_substr(NoteText::fromDocument($document), 0, NoteController::MAX_TEXT_CHARS)
                    : null,
                'shared_from' => Str::limit($share->sender->name, 100, ''),
            ]);

            // the copy of the note held on the server is thrown away once it has been used
            $share->update([
                'status' => 'accepted',
                'responded_at' => now(),
                'content' => null,
                'preview' => null,
            ]);

            $this->markNotificationRead($user, $share);

            return [$note->load('folder:id,name'), $share];
        });

        Notifier::noteShareAnswered($share, $user, true);

        return ['note_id' => $note->id, 'folder' => $note->folder?->name];
    }

    public function decline(Request $request, string $id)
    {
        $user = $request->user();

        NoteShare::expireOld();

        $share = DB::transaction(function () use ($user, $id) {
            $share = NoteShare::forRecipient($user)->lockForUpdate()->findOrFail($id);

            $this->ensureOpen($share);

            $share->update([
                'status' => 'declined',
                'responded_at' => now(),
                'content' => null,
                'preview' => null,
            ]);

            $this->markNotificationRead($user, $share);

            return $share;
        });

        Notifier::noteShareAnswered($share, $user, false);

        return response()->noContent();
    }

    private function ensureOpen(NoteShare $share): void
    {
        $expired = $share->status === 'expired'
            || ($share->status === 'pending' && $share->expires_at->isPast());

        if ($expired) {
            abort(410, 'This shared note has expired.');
        }

        if ($share->status !== 'pending') {
            abort(409, 'You already answered this shared note.');
        }
    }

    private function markNotificationRead($user, NoteShare $share): void
    {
        $user->userNotifications()
            ->where('share_id', $share->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}