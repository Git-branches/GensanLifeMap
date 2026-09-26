<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The API surface is JSON-only. Forcing the Accept header here means
 * guests get a clean JSON 401 (never a redirect to a web login route
 * that does not exist) even when callers omit Accept themselves.
 * The Next.js client always sends Accept: application/json anyway.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
