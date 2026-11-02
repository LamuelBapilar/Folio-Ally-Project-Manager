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
        Schema::create('note_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();
    
            // a person can't have two folders with the same name
            $table->unique(['user_id', 'name']);
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('note_folders');
    }
};
