<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminResourceController;
use App\Http\Controllers\Api\AuthController;
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
| Public read-only discovery resources and authenticated account/report
| workflows. Sanctum protects account and report actions; moderation also
| checks for an authorized staff role.
|
*/

Route::middleware('throttle:60,1')->group(function (): void {
    // Authentication (public, additionally rate-limited against abuse)
    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    // Authenticated account and resident report surface.
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
        Route::put('user/profile', [AuthController::class, 'updateProfile']);
        Route::put('user/password', [AuthController::class, 'changePassword']);

        Route::get('community-reports/mine', [CommunityReportController::class, 'mine']);
        Route::get('community-reports/{communityReport}', [CommunityReportController::class, 'show']);
        Route::post('community-reports', [CommunityReportController::class, 'store']);

        // Only authorized staff may moderate reports.
        Route::middleware('staff')->patch(
            'community-reports/{communityReport}/status',
            [CommunityReportController::class, 'updateStatus']
        );
    });

    // Staff workspace. Moderators may review reports and view the overview;
    // content, account, and audit management are administrator-only.
    Route::middleware(['auth:sanctum', 'staff'])->prefix('admin')->group(function (): void {
        Route::get('overview', [AdminController::class, 'overview']);
        Route::get('community-reports', [AdminController::class, 'reports']);
        Route::get('community-reports/{communityReport}', [AdminController::class, 'report']);

        Route::middleware('administrator')->group(function (): void {
            Route::get('users', [AdminController::class, 'users']);
            Route::put('users/{user}/role', [AdminController::class, 'updateUserRole']);
            Route::get('audit-logs', [AdminController::class, 'auditLogs']);

            Route::get('{resource}', [AdminResourceController::class, 'index'])
                ->whereIn('resource', ['locations', 'projects', 'facilities', 'announcements', 'data-sources']);
            Route::post('{resource}', [AdminResourceController::class, 'store'])
                ->whereIn('resource', ['locations', 'projects', 'facilities', 'announcements', 'data-sources']);
            Route::get('{resource}/{id}', [AdminResourceController::class, 'show'])
                ->whereIn('resource', ['locations', 'projects', 'facilities', 'announcements', 'data-sources'])
                ->whereNumber('id');
            Route::put('{resource}/{id}', [AdminResourceController::class, 'update'])
                ->whereIn('resource', ['locations', 'projects', 'facilities', 'announcements', 'data-sources'])
                ->whereNumber('id');
            Route::delete('{resource}/{id}', [AdminResourceController::class, 'destroy'])
                ->whereIn('resource', ['locations', 'projects', 'facilities', 'announcements', 'data-sources'])
                ->whereNumber('id');
        });
    });

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

});
