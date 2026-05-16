<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'display_name' => $request->display_name,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'is_active' => true,
        ]);

        $token = $user->createToken('auth-token', ['user'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'token' => $token,
                'role' => 'user'
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account with those credentials.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth-token', ['user'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'token' => $token,
                'role' => 'user'
            ]
        ]);
    }

    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (! $admin || ! Hash::check($request->password, $admin->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid admin credentials.'],
            ]);
        }

        if (! $admin->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This admin account is currently inactive.'],
            ]);
        }

        $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $admin,
                'token' => $token,
                'role' => 'admin'
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'role' => $user instanceof Admin ? 'admin' : 'user'
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    public function redirectToGoogle()
    {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver('google');
        return $driver->stateless()->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver('google');
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = $driver->stateless()->user();
            
            // Find user by google_id or email
            $user = User::where('google_oauth_id', $googleUser->id)
                        ->orWhere('email', $googleUser->email)
                        ->first();

            if (! $user) {
                // Register new user
                $user = User::create([
                    'display_name' => $googleUser->name ?? explode('@', $googleUser->email)[0],
                    'email' => $googleUser->email,
                    'google_oauth_id' => $googleUser->id,
                    'password_hash' => bcrypt(str()->random(24)),
                    'profile_photo_url' => $googleUser->avatar,
                    'is_active' => true,
                ]);
            } else if (! $user->google_oauth_id) {
                // Link account if email existed but not linked
                $user->update([
                    'google_oauth_id' => $googleUser->id,
                    'profile_photo_url' => $user->profile_photo_url ?? $googleUser->avatar,
                ]);
            }

            if (! $user->is_active) {
                return redirect()->away('http://localhost:3000/login?error=account_deactivated');
            }

            $token = $user->createToken('auth-token', ['user'])->plainTextToken;

            // Redirect back to frontend with the token
            return redirect()->away('http://localhost:3000/auth/callback?token=' . $token);
        } catch (\Exception $e) {
            return redirect()->away('http://localhost:3000/login?error=oauth_failed');
        }
    }
}
