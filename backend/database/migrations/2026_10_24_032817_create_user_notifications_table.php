<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // board_invitation, story_due_soon, story_due_today, story_overdue
            $table->string('type');

            // the text is copied in, so history stays readable after edits and deletes
            $table->string('title');
            $table->string('body')->nullable();

            $table->foreignId('board_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('story_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('invitation_id')->nullable()->constrained('board_invitations')->nullOnDelete();

            // identifies "the same notification", so it is recorded once per person
            $table->string('dedupe_key');

            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
