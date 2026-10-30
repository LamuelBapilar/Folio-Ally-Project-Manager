<?php

namespace App\Http\Controllers;

use App\Models\BoardInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    // the details shown in the "review invitation" window
    public function show(Request $request, string $id)
    {
        $invitation = $this->mine($request, $id)->load([
            'board' => fn ($q) => $q->withCount(['stories', 'members']),
            'inviter:id,name,email',
        ]);

        return [
            'id' => $invitation->id,
            'status' => $invitation->status,
            'created_at' => $invitation->created_at,
            'board' => [
                'id' => $invitation->board->id,
                'name' => $invitation->board->name,
                'description' => $invitation->board->description,
                'stories_count' => $invitation->board->stories_count,
                // the members plus the owner
                'people_count' => $invitation->board->members_count + 1,
            ],
            'inviter' => $invitation->inviter,
        ];
    }

    public function accept(Request $request, string $id)
    {
        $invitation = $this->pending($request, $id);

        DB::transaction(function () use ($invitation, $request) {
            $invitation->board->members()->syncWithoutDetaching([$request->user()->id]);
            $invitation->update(['status' => 'accepted']);
            $this->markNotificationRead($request, $invitation);
        });

        return ['board_id' => $invitation->board_id];
    }

    public function decline(Request $request, string $id)
    {
        $invitation = $this->pending($request, $id);

        DB::transaction(function () use ($invitation, $request) {
            $invitation->update(['status' => 'declined']);
            $this->markNotificationRead($request, $invitation);
        });

        return response()->noContent();
    }

    // an invitation sent to MY email, in any state
    private function mine(Request $request, string $id): BoardInvitation
    {
        return BoardInvitation::where('email', Str::lower($request->user()->email))
            ->findOrFail($id);
    }

    // an invitation sent to MY email that is still waiting for an answer
    private function pending(Request $request, string $id): BoardInvitation
    {
        return BoardInvitation::where('email', Str::lower($request->user()->email))
            ->where('status', 'pending')
            ->findOrFail($id);
    }

    private function markNotificationRead(Request $request, BoardInvitation $invitation): void
    {
        $request->user()->userNotifications()
            ->where('invitation_id', $invitation->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}