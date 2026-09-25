<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\CommunityReportController;
use App\Http\Controllers\Api\DataSourceController;
use App\Http\Controllers\Api\FacilityController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| GenSan LifeMap API (Phase 3 — foundation)
|--------------------------------------------------------------------------
|
| Public read-only resources plus controlled community-report submission.
| Administrative moderation routes sit behind the `auth.required` placeholder
| middleware, which denies with 401 until real authentication is added in
| the next phase. No controller/route changes will be needed for that swap.
|
*/

Route::middleware('throttle:60,1')->group(function (): void {
    // Locations
    Route::get('locations', [LocationController::class, 'index']);
    Route::get('locations/{location}', [LocationController::class, 'show']);

    // Projects
    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{project}', [ProjectController::class, 'show']);

    // Facilities
    Route::get('facilities', [FacilityController::class, 'index']);
    Route::get('facilities/{facility}', [FacilityController::class, 'show']);

    // Announcements (public listing defaults to published)
    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::get('announcements/{announcement}', [AnnouncementController::class, 'show']);

    // Data sources
    Route::get('data-sources', [DataSourceController::class, 'index']);
    Route::get('data-sources/{dataSource}', [DataSourceController::class, 'show']);

    // Community reports — controlled public surface
    Route::get('community-reports', [CommunityReportController::class, 'index']);
    Route::get('community-reports/{communityReport}', [CommunityReportController::class, 'show']);
    Route::post('community-reports', [CommunityReportController::class, 'store']);

    // Moderation — protected (currently 401 for all callers; see middleware)
    Route::middleware('auth.required')->group(function (): void {
        Route::patch(
            'community-reports/{communityReport}/status',
            [CommunityReportController::class, 'updateStatus']
        );
    });
});
