<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Services\Notifier;



class BoardMemberController extends Controller
{
    // anyone on the board can see who is on it
    public function index(Request $request, string $boardId)
    {
        $user = $request->user();
        $board = Board::accessibleTo($user)->with('user:id,name,email')->findOrFail($boardId);

        $isOwner = $board->user_id === $user->id;

        return [
            'owner' => $board->user,
            'members' => $board->members()->get(['users.id', 'users.name', 'users.email']),
            // only the owner sees who has been invited
            'invitations' => $isOwner
                ? $board->invitations()->where('status', 'pending')->latest()->get(['id', 'email', 'created_at'])
                : [],
        ];
    }

    // owner only
    public function invite(Request $request, string $boardId)
    {
        $board = $request->user()->boards()->findOrFail($boardId);

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = Str::lower($data['email']);

        if ($email === Str::lower($request->user()->email)) {
            throw ValidationException::withMessages(['email' => 'You already own this board.']);
        }

        if ($board->members()->where('users.email', $email)->exists()) {
            throw ValidationException::withMessages(['email' => 'That person is already on this board.']);
        }

        $invitation = $board->invitations()->firstOrNew(['email' => $email]);

        if ($invitation->exists && $invitation->status === 'pending') {
            throw ValidationException::withMessages(['email' => 'That email has already been invited.']);
        }

        // the invitation and its notification are saved together: both exist, or neither does
        DB::transaction(function () use ($invitation, $request, $email) {
            $invitation->fill([
                'invited_by' => $request->user()->id,
                'status' => 'pending',
            ])->save();

            // someone without an account yet gets theirs recorded the first time
            // their notifications load after they register
            $invitee = User::where('email', $email)->first();

            if ($invitee) {
                Notifier::invitation($invitation, $invitee);
            }
        });

        return response()->json($invitation->only(['id', 'email', 'created_at']), 201);
    }

    // owner only
    public function cancelInvite(Request $request, string $boardId, string $invitationId)
    {
        $board = $request->user()->boards()->findOrFail($boardId);

        $board->invitations()
            ->where('id', $invitationId)
            ->where('status', 'pending')
            ->delete();

        return response()->noContent();
    }

    // the owner can remove anyone, and a member can remove themselves (leave)
    public function removeMember(Request $request, string $boardId, string $userId)
    {
        $board = Board::accessibleTo($request->user())->findOrFail($boardId);

        $isOwner = $board->user_id === $request->user()->id;

        abort_unless($isOwner || (int) $userId === $request->user()->id, 403);

        DB::transaction(function () use ($board, $userId) {
            $board->members()->detach($userId);

            // their stories go back to unassigned
            $board->stories()->where('assigned_to', $userId)->update(['assigned_to' => null]);

            // these point at a board they can no longer open
            UserNotification::where('user_id', $userId)
                ->where('board_id', $board->id)
                ->whereIn('type', UserNotification::BOARD_TYPES)
                ->delete();
        });

        return response()->noContent();
    }
}