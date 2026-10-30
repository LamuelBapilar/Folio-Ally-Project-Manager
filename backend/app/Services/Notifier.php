<?php

namespace App\Services;

use App\Enums\StoryStatus;
use App\Models\BoardInvitation;
use App\Models\Story;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Throwable;

class Notifier
{
    // makes sure everything this person should have been told about is recorded
    public static function sync(User $user): void
    {
        self::invitations($user);
        self::deadlines($user);
    }

    // a new invitation, or a re-invite: it always shows up as new and unread
    public static function invitation(BoardInvitation $invitation, User $user): void
    {
        $row = self::invitationRow($invitation);

        UserNotification::where('user_id', $user->id)
            ->where('dedupe_key', $row['dedupe_key'])
            ->delete();

        UserNotification::create(['user_id' => $user->id] + $row);
    }

    // pending invitations sent to this person's email, recorded if they are not yet
    // (this is also how someone who registers after being invited gets theirs)
    public static function invitations(User $user): void
    {
        $invitations = BoardInvitation::with(['board:id,name', 'inviter:id,name'])
            ->where('email', Str::lower($user->email))
            ->where('status', 'pending')
            ->get();

        self::recordMissing(
            $user,
            $invitations->map(fn (BoardInvitation $i) => self::invitationRow($i))
        );
    }

    // stories due tomorrow, due today, or overdue, on every board this person can open
    public static function deadlines(User $user): void
    {
        $stories = Story::with('board:id,name')
            ->whereHas('board', fn ($q) => $q->accessibleTo($user))
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', today()->addDay()->toDateString())
            ->where('status', '!=', StoryStatus::Done->value)
            ->get();

        self::recordMissing(
            $user,
            $stories->map(fn (Story $story) => self::deadlineRow($story))
        );
    }

    // called right after a story is saved, so everyone on the board is told straight away
    public static function story(Story $story): void
    {
        try {
            $story->loadMissing('board.members');

            $row = self::deadlineRow($story);

            if (! $row) {
                return;
            }

            $ids = $story->board->members->pluck('id')->push($story->board->user_id)->unique();

            User::whereIn('id', $ids)->get()->each(
                fn (User $user) => self::recordMissing($user, collect([$row]))
            );
        } catch (Throwable $e) {
            // the story is already saved, and the next sync records this notification
            report($e);
        }
    }

    // tells someone a story was assigned to them (never for assigning yourself)
    public static function assigned(Story $story, User $by): void
    {
        if (! $story->assigned_to || (int) $story->assigned_to === (int) $by->id) {
            return;
        }

        try {
            $story->loadMissing('board:id,name');

            $due = $story->due_date ? ' · due '.$story->due_date->format('M j') : '';

            UserNotification::create([
                'user_id' => $story->assigned_to,
                'type' => 'story_assigned',
                'title' => Str::limit($by->name, 60).' assigned you to '.Str::limit($story->title, 140),
                'body' => $story->board->name.$due,
                'board_id' => $story->board_id,
                'story_id' => $story->id,
                // every assignment is its own event: A to B, then C, then B again, tells B twice
                'dedupe_key' => 'assigned:'.Str::uuid(),
            ]);
        } catch (Throwable $e) {
            // the story is already saved: a missing notification must not break that
            report($e);
        }
    }

    private static function invitationRow(BoardInvitation $invitation): array
    {
        $invitation->loadMissing(['board:id,name', 'inviter:id,name']);

        $inviter = Str::limit($invitation->inviter->name, 60);
        $board = Str::limit($invitation->board->name, 100);

        return [
            'type' => 'board_invitation',
            'title' => "{$inviter} invited you to {$board}",
            'body' => 'Review the invitation to join this board',
            'board_id' => $invitation->board_id,
            'invitation_id' => $invitation->id,
            'dedupe_key' => "invite:{$invitation->id}",
        ];
    }

    private static function deadlineRow(Story $story): ?array
    {
        if (! $story->due_date || $story->status === StoryStatus::Done) {
            return null;
        }

        $today = today()->toDateString();
        $due = $story->due_date->toDateString();

        // more than a day away: nothing to say yet
        if ($due > today()->addDay()->toDateString()) {
            return null;
        }

        [$type, $label] = match (true) {
            $due < $today => ['story_overdue', 'is overdue'],
            $due === $today => ['story_due_today', 'is due today'],
            default => ['story_due_soon', 'is due tomorrow'],
        };

        return [
            'type' => $type,
            'title' => Str::limit($story->title, 180)." {$label}",
            'body' => "{$story->board->name} · due ".$story->due_date->format('M j'),
            'board_id' => $story->board_id,
            'story_id' => $story->id,
            // a new due date counts as a new reminder
            'dedupe_key' => "due:{$story->id}:{$type}:{$due}",
        ];
    }

    private static function recordMissing(User $user, Collection $rows): void
    {
        $rows = $rows->filter()->values();

        if ($rows->isEmpty()) {
            return;
        }

        $existing = UserNotification::where('user_id', $user->id)
            ->whereIn('dedupe_key', $rows->pluck('dedupe_key'))
            ->pluck('dedupe_key')
            ->all();

        foreach ($rows as $row) {
            if (in_array($row['dedupe_key'], $existing, true)) {
                continue;
            }

            // createOrFirst inserts first and leans on the unique index, so two
            // requests recording the same thing at once cannot make a duplicate
            UserNotification::createOrFirst(
                ['user_id' => $user->id, 'dedupe_key' => $row['dedupe_key']],
                $row
            );
        }
    }
}