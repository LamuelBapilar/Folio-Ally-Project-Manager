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
        Schema::create('board_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('status')->default('pending'); // pending, accepted, declined
            $table->timestamps();
    
            $table->unique(['board_id', 'email']);
            $table->index(['email', 'status']);
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('board_invitations');
    }
};
