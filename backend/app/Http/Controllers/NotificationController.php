<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Throwable;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        try {
            Notifier::sync($user);
        } catch (Throwable $e) {
            // still show what is already recorded; the error is in storage/logs/laravel.log
            report($e);
        }

        $notifications = $user->userNotifications()
            ->with('invitation:id,status')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        // which of these boards can this person still open?
        $openable = Board::accessibleTo($user)
            ->whereIn('boards.id', $notifications->pluck('board_id')->filter()->unique())
            ->pluck('boards.id');

        $notifications->each(fn ($n) => $n->setAttribute(
            'can_open',
            $n->board_id !== null && $openable->contains($n->board_id)
        ));

        return [
            'data' => $notifications,
            'unread_count' => $user->userNotifications()->whereNull('read_at')->count(),
        ];
    }

    public function read(Request $request)
    {
        $data = $request->validate([
            'ids' => ['sometimes', 'array'],
            'ids.*' => ['integer'],
        ]);

        $query = $request->user()->userNotifications()->whereNull('read_at');

        // no ids means "mark everything as read"
        if (isset($data['ids'])) {
            $query->whereIn('id', $data['ids']);
        }

        $query->update(['read_at' => now()]);

        return response()->noContent();
    }
}