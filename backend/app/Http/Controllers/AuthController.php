<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    private const MAX_FAILED_LOGINS = 5;
    private const LOCKOUT_SECONDS = 300;
    private const TOKEN_DAYS = 7;
    private const MAX_TOKENS = 5; // logged-in devices per person

    public function register(Request $request)
    {
        // emails are always stored in lowercase, which is how invitations match them
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'max:72', Password::defaults()],
        ]);

        $user = User::create($data); // password is hashed by the model cast

        return response()->json([
            'user' => $user,
            'token' => $this->issueToken($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $email = Str::lower(trim($data['email']));

        // failures are counted per email AND address, so a stranger cannot lock
        // someone out of their own account from somewhere else
        $key = 'login-failures:'.sha1($email.'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($key, self::MAX_FAILED_LOGINS)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too many failed attempts.',
                'retry_after' => $seconds,
            ], 429)->header('Retry-After', $seconds);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            // spend the same time as a real check, so the response time does not
            // reveal which emails have an account
            Hash::make($data['password']);
        }

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, self::LOCKOUT_SECONDS);

            return response()->json(['message' => 'Invalid email or password'], 422);
        }

        RateLimiter::clear($key);

        return response()->json([
            'user' => $user,
            'token' => $this->issueToken($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function issueToken(User $user): string
    {
        // keep only the newest few logins: older devices have to log in again
        $old = $user->tokens()
            ->latest('id')
            ->skip(self::MAX_TOKENS - 1)
            ->take(1000)
            ->pluck('id');

        if ($old->isNotEmpty()) {
            $user->tokens()->whereIn('id', $old)->delete();
        }

        return $user->createToken('auth', ['*'], now()->addDays(self::TOKEN_DAYS))->plainTextToken;
    }
}