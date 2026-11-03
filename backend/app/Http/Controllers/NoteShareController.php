<?php

namespace App\Http\Controllers;

use App\Models\NoteShare;
use App\Models\User;
use App\Services\Notifier;
use App\Support\NoteDocument;
use App\Support\NoteText;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NoteShareController extends Controller
{
    // shared notes waiting for an answer, per sender
    private const MAX_PENDING = 20;

    public function index(Request $request, string $noteId)
    {
        $note = $request->user()->notes()->findOrFail($noteId);

        NoteShare::expireOld();

        return [
            'data' => $note->shares()->latest('id')->limit(20)->get()
                ->map(fn (NoteShare $share) => $this->present($share))
                ->values(),
        ];
    }

    public function store(Request $request, string $noteId)
    {
        $user = $request->user();

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = $data['email'];

        if ($email === Str::lower($user->email)) {
            throw ValidationException::withMessages([
                'email' => "You can't share a note with yourself.",
            ]);
        }

        NoteShare::expireOld();

        $share = DB::transaction(function () use ($user, $noteId, $email) {
            // locking the note means two quick clicks make one share, not two
            $note = $user->notes()->whereKey($noteId)->lockForUpdate()->firstOrFail();

            // what is sent is the saved note, rebuilt through the allow-list
            $document = NoteDocument::clean($note->content);
            $text = $document ? NoteText::fromDocument($document) : '';
            $title = trim($note->title);

            if ($title === '' && $text === '') {
                throw ValidationException::withMessages([
                    'email' => 'This note is empty. Write something before sharing it.',
                ]);
            }

            $waiting = NoteShare::pending()->where('sender_id', $user->id);

            if ((clone $waiting)->where('note_id', $note->id)->where('recipient_email', $email)->exists()) {
                throw ValidationException::withMessages([
                    'email' => 'You already shared this note with that email. It is waiting for an answer.',
                ]);
            }

            if ((clone $waiting)->count() >= self::MAX_PENDING) {
                throw ValidationException::withMessages([
                    'email' => 'You have '.self::MAX_PENDING.' shared notes waiting for an answer. Cancel one, or wait for answers.',
                ]);
            }

            $share = NoteShare::create([
                'sender_id' => $user->id,
                'note_id' => $note->id,
                'recipient_email' => $email,
                'title' => Str::limit($title, 255, ''),
                'content' => $document,
                'preview' => Str::limit($text, 160),
                'status' => 'pending',
                'expires_at' => now()->addDays(NoteShare::EXPIRES_IN_DAYS),
            ]);

            // if they already have an account they are told now; if not, on their first sign-in
            // (the answer is the same either way, so this cannot be used to find out who has one)
            $recipient = User::where('email', $email)->first();

            if ($recipient) {
                Notifier::noteShare($share, $recipient);
            }

            return $share;
        });

        return response()->json($this->present($share), 201);
    }

    // cancels a share that has not been answered
    public function destroy(Request $request, string $noteId, string $shareId)
    {
        $note = $request->user()->notes()->findOrFail($noteId);

        $note->shares()->where('id', $shareId)->where('status', 'pending')->delete();

        return response()->noContent();
    }

    private function present(NoteShare $share): array
    {
        return [
            'id' => $share->id,
            'email' => $share->recipient_email,
            'status' => $share->status,
            'created_at' => $share->created_at,
            'expires_at' => $share->expires_at,
            'responded_at' => $share->responded_at,
        ];
    }
}