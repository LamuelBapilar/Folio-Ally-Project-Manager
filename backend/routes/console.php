<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Laravel\Sanctum\PersonalAccessToken;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('notifications:sync')->hourly();

// expired logins are useless: clear them out once a day
Schedule::call(fn () => PersonalAccessToken::whereNotNull('expires_at')
    ->where('expires_at', '<', now()->subDay())
    ->delete())
    ->daily()
    ->name('prune-expired-tokens');