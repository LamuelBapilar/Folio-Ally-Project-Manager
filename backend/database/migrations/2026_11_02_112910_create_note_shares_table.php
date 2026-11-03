<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('note_id')->nullable()->constrained('notes')->nullOnDelete();
            $table->string('recipient_email');
            $table->string('title');
            $table->longText('content')->nullable();   // the note as it was when sent
            $table->string('preview', 200)->nullable();
            $table->string('status')->default('pending'); // pending, accepted, declined, expired
            $table->dateTime('responded_at')->nullable();
            $table->dateTime('expires_at'); // dateTime, not timestamp: see the note above
            $table->timestamps();

            $table->index(['recipient_email', 'status']);
            $table->index(['sender_id', 'status']);
            $table->index(['status', 'expires_at']);
        });

        // a note that arrived through a share remembers who sent it
        Schema::table('notes', function (Blueprint $table) {
            $table->string('shared_from', 120)->nullable()->after('is_pinned');
        });

        // notifications can point at a share, like they point at an invitation
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->foreignId('share_id')->nullable()->after('invitation_id')
                ->constrained('note_shares')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('share_id');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('shared_from');
        });

        Schema::dropIfExists('note_shares');
    }
};