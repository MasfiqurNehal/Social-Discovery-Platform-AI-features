<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && isset($user->is_active) && !$user->is_active) {
            $user->currentAccessToken()->delete();
            return response()->json([
                'status' => 'error',
                'message' => 'Your account has been deactivated.'
            ], 403);
        }

        return $next($request);
    }
}
