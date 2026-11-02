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
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    
            // deleting a folder keeps its notes: they become unfiled
            $table->foreignId('folder_id')->nullable()->constrained('note_folders')->nullOnDelete();
    
            $table->string('title')->default('');
            $table->longText('content')->nullable();       // the editor document, as JSON
            $table->longText('content_text')->nullable();  // plain-text copy for search and previews
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
    
            $table->index(['user_id', 'updated_at']);
            $table->index(['user_id', 'folder_id']);
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
