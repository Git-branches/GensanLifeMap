<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('category', 50)->default('other')->index();
            $table->string('title');
            $table->text('description')->nullable();
            // Stores a relative storage path (e.g. "reports/xxxx.jpg"), never binary data.
            $table->string('photo_path', 1024)->nullable();
            $table->string('status', 30)->default('submitted')->index();
            $table->timestamps();

            $table->index(['status', 'category']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_reports');
    }
};
