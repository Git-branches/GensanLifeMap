<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_reports', function (Blueprint $table) {
            // Exact spot the resident pinned on the map. Optional: the
            // report still belongs to the nearest listed location.
            $table->decimal('latitude', 10, 7)->nullable()->after('photo_path');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('community_reports', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
