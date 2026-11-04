<?php

namespace App\Http\Controllers;

use App\Models\NoteShare;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update($data);

        return $user->fresh();
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:72', Password::defaults(), 'different:current_password'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'That is not your current password.',
            ]);
        }

        $user->update(['password' => $data['password']]); // hashed by the model cast

        // every other device has to log in again with the new password
        $user->tokens()->where('id', '!=', $this->currentTokenId($request))->delete();

        return response()->noContent();
    }

    public function sessions(Request $request)
    {
        $user = $request->user();
        $currentId = $this->currentTokenId($request);

        $tokens = $user->tokens()
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get();

        return [
            'data' => $tokens->map(fn ($token) => [
                'id' => $token->id,
                'user_agent' => $token->user_agent,
                'created_at' => $token->created_at,
                'last_used_at' => $token->last_used_at,
                'expires_at' => $token->expires_at,
                'current' => $token->id === $currentId,
            ])->values(),
        ];
    }

    // signs one other device out
    public function revoke(Request $request, string $id)
    {
        $token = $request->user()->tokens()->findOrFail($id);

        if ($token->id === $this->currentTokenId($request)) {
            throw ValidationException::withMessages([
                'session' => 'This is the device you are using. Use Sign out instead.',
            ]);
        }

        $token->delete();

        return response()->noContent();
    }

    // signs every other device out
    public function revokeOthers(Request $request)
    {
        $request->user()->tokens()->where('id', '!=', $this->currentTokenId($request))->delete();

        return response()->noContent();
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'That password is not correct.',
            ]);
        }

        DB::transaction(function () use ($user) {
            // other people's reminders about boards and notes that are about to disappear
            $boardIds = $user->boards()->pluck('id');
            UserNotification::whereIn('board_id', $boardIds)->delete();

            $shareIds = NoteShare::where('sender_id', $user->id)->pluck('id');
            UserNotification::whereIn('share_id', $shareIds)->delete();

            // tokens are not removed by the database, so they are deleted by hand
            $user->tokens()->delete();

            // the database removes the rest: boards, stories, members, notes, folders, shares
            $user->delete();
        });

        return response()->noContent();
    }

    private function currentTokenId(Request $request): int
    {
        return $request->user()->currentAccessToken()->id;
    }
}