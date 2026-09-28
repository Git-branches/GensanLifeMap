<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffRole
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(in_array($request->user()?->role, [User::ROLE_ADMIN, User::ROLE_MODERATOR], true), 403, 'Staff access required.');

        return $next($request);
    }
}
