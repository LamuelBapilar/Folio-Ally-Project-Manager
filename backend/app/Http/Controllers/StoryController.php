<?php

namespace App\Http\Controllers;

use App\Enums\StoryCategory;
use App\Enums\StoryPriority;
use App\Enums\StoryStatus;
use App\Models\Board;
use App\Models\Story;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoryController extends Controller
{
    public function index(Request $request, string $boardId)
    {
        $board = Board::accessibleTo($request->user())->findOrFail($boardId);

        return $board->stories()->with('assignee:id,name')->orderBy('position')->get();
    }

    public function store(Request $request, string $boardId)
    {
        $board = Board::accessibleTo($request->user())->findOrFail($boardId);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(StoryStatus::class)],
            'priority' => ['nullable', Rule::enum(StoryPriority::class)],
            'category' => ['nullable', Rule::enum(StoryCategory::class)],
            'due_date' => ['nullable', 'date'],
            'progress' => ['sometimes', 'integer', 'between:0,100'],
            // only people on this board can be assigned
            'assigned_to' => ['nullable', 'integer', Rule::in($this->peopleIds($board))],
        ]);

        $status = $data['status'] ?? StoryStatus::Backlog->value;
        $data['status'] = $status;
        $data['position'] = $board->stories()->where('status', $status)->max('position') + 1;

        // finished stories are always 100%
        if ($status === StoryStatus::Done->value) {
            $data['progress'] = 100;
        }

        // fresh() loads the database defaults too, so progress is always in the response
        $story = $board->stories()->create($data)->fresh(['assignee:id,name']);

        // record a deadline notification right away if this story is due soon
        Notifier::story($story);
        Notifier::assigned($story, $request->user());

        return response()->json($story, 201);
    }

    public function update(Request $request, string $id)
    {
        $story = $this->accessibleStory($request, $id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(StoryStatus::class)],
            'priority' => ['nullable', Rule::enum(StoryPriority::class)],
            'category' => ['nullable', Rule::enum(StoryCategory::class)],
            'due_date' => ['nullable', 'date'],
            'progress' => ['sometimes', 'integer', 'between:0,100'],
            'assigned_to' => ['nullable', 'integer', Rule::in($this->peopleIds($story->board))],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        // finished stories are always 100%
        $finalStatus = $data['status'] ?? $story->status->value;

        if ($finalStatus === StoryStatus::Done->value) {
            $data['progress'] = 100;
        }

        // moved to another column without a position: put it at the end
        if (
            isset($data['status'])
            && $data['status'] !== $story->status->value
            && ! isset($data['position'])
        ) {
            $data['position'] = $story->board->stories()
                ->where('status', $data['status'])
                ->max('position') + 1;
        }

        $previousAssignee = $story->assigned_to;

        $story->update($data);

        $story = $story->fresh(['assignee:id,name']);

        // a new due date can mean a new notification
        Notifier::story($story);

        // only tell someone when the assignee actually changed
        if (array_key_exists('assigned_to', $data) && $story->assigned_to !== $previousAssignee) {
            Notifier::assigned($story, $request->user());
        }

        return $story;
    }

    public function destroy(Request $request, string $id)
    {
        $this->accessibleStory($request, $id)->delete();

        return response()->noContent();
    }

    public function reorder(Request $request, string $boardId)
    {
        $board = Board::accessibleTo($request->user())->findOrFail($boardId);

        $data = $request->validate([
            'stories' => ['required', 'array'],
            'stories.*.id' => ['required', 'integer'],
            'stories.*.status' => ['required', Rule::enum(StoryStatus::class)],
            'stories.*.position' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($board, $data) {
            foreach ($data['stories'] as $item) {
                $values = [
                    'status' => $item['status'],
                    'position' => $item['position'],
                ];

                // finished stories are always 100%
                if ($item['status'] === StoryStatus::Done->value) {
                    $values['progress'] = 100;
                }

                // scoped to this board, so ids from other boards are ignored
                $board->stories()->where('id', $item['id'])->update($values);
            }
        });

        return response()->noContent();
    }

    // the owner plus every member: the only people a story on this board can be assigned to
    private function peopleIds(Board $board): array
    {
        return $board->members()
            ->pluck('users.id')
            ->push($board->user_id)
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    // a story on any board this person owns or has joined
    private function accessibleStory(Request $request, string $id): Story
    {
        return Story::whereHas('board', fn ($q) => $q->accessibleTo($request->user()))
            ->findOrFail($id);
    }
}