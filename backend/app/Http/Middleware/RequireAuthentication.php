<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Temporary placeholder for admin/moderator authentication.
 *
 * There is no auth system yet (by design for this phase), so every request
 * to routes behind this middleware is denied with 401 JSON. Replace the
 * `auth.required` alias with a real authentication middleware (e.g. Sanctum)
 * in the next phase — no controller or route changes will be needed.
 */
class RequireAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        return response()->json([
            'message' => 'Authentication required. Admin authentication will be enabled in the next phase.',
        ], 401);
    }
}
