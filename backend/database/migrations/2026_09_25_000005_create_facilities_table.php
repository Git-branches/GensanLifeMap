<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 100)->nullable()->index();
            $table->text('description')->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->string('operating_hours')->nullable();
            $table->timestamps();

            $table->index(['category', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
