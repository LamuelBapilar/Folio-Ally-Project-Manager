<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->passwordRules();
        $this->rateLimits();
    }

    private function passwordRules(): void
    {
        Password::defaults(function () {
            $rule = Password::min(8)->letters()->mixedCase()->numbers();

            // also reject passwords found in known data breaches (needs internet access)
            return app()->isProduction() ? $rule->uncompromised() : $rule;
        });
    }

    private function rateLimits(): void
    {
        // the person when logged in, otherwise their network address
        $who = fn (Request $request) => $request->user()?->id ?: $request->ip();

        // public routes: strict, and by network address
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('register', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        // everything behind login: by person
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($who($request)));
        RateLimiter::for('writes', fn (Request $request) => Limit::perMinute(60)->by($who($request)));
        RateLimiter::for('creates', fn (Request $request) => Limit::perHour(30)->by($who($request)));
        RateLimiter::for('invites', fn (Request $request) => Limit::perHour(20)->by($who($request)));
        RateLimiter::for('notifications', fn (Request $request) => Limit::perMinute(60)->by($who($request)));
    }
}