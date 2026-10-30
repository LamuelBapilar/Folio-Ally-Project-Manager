<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Notifier;
use Illuminate\Console\Command;
use Throwable;

class SyncNotifications extends Command
{
    protected $signature = 'notifications:sync';

    protected $description = 'Record any missing notifications for every user';

    public function handle(): void
    {
        $failed = 0;

        User::chunkById(100, function ($users) use (&$failed) {
            foreach ($users as $user) {
                try {
                    Notifier::sync($user);
                } catch (Throwable $e) {
                    $failed++;
                    report($e);
                }
            }
        });

        $failed
            ? $this->error("Synced with {$failed} failure(s). See storage/logs/laravel.log.")
            : $this->info('Notifications synced.');
    }
}