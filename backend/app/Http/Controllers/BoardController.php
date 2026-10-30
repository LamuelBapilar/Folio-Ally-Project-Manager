<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BoardController extends Controller
{
    public function index(Request $request)
    {
        return Board::accessibleTo($request->user())->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        return response()->json($request->user()->boards()->create($data), 201);
    }

    public function show(Request $request, string $id)
    {
        return Board::accessibleTo($request->user())
            ->with([
                'stories' => fn ($q) => $q->orderBy('position'),
                'stories.assignee:id,name',
            ])
            ->findOrFail($id);
    }

    // owner only
    public function update(Request $request, string $id)
    {
        $board = $request->user()->boards()->findOrFail($id);

        $board->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]));

        return $board;
    }

    // owner only: the stories, members, and invitations go with it
    public function destroy(Request $request, string $id)
    {
        $board = $request->user()->boards()->findOrFail($id);

        DB::transaction(function () use ($board) {
            // everyone's reminders for this board would only point at nothing
            UserNotification::where('board_id', $board->id)
                ->whereIn('type', UserNotification::BOARD_TYPES)
                ->delete();

            $board->delete();
        });

        return response()->noContent();
    }
}