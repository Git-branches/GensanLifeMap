<?php

namespace App\Providers;

use App\Support\EmailVerificationLink;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Emails link to the Next.js frontend, which then calls the API.
        ResetPassword::createUrlUsing(fn ($user, string $token): string => rtrim((string) config('app.frontend_url'), '/')
            .'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()]));

        VerifyEmail::createUrlUsing(fn ($user): string => EmailVerificationLink::url($user));

        // Named limiters keep their own counters. Plain `throttle:N,M` rules
        // nested inside the API-wide `throttle:60,1` share its counter, so a
        // strict limit would trip on ordinary page traffic.
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by('auth|'.$request->ip()));
        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(5)->by('password-reset|'.$request->ip()));
        RateLimiter::for('email-verify', fn (Request $request) => Limit::perMinute(10)->by('email-verify|'.$request->ip()));
        RateLimiter::for('verification-notification', fn (Request $request) => Limit::perMinute(3)
            ->by('verification-notification|'.($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
