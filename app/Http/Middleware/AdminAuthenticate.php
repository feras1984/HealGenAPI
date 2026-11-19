<?php

namespace App\Http\Middleware;

use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class AdminAuthenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        if ($request->expectsJson()) {
            return null;
        }

        $locale = $request->route('locale')
            ?? $request->cookie('locale')
            ?? ($request->hasSession() ? $request->session()->get('locale') : null)
            ?? $request->getPreferredLanguage(['en', 'ar'])
            ?? app()->getLocale()
            ?? config('app.locale', 'en');

        if (!in_array($locale, ['en', 'ar'], true)) {
            $locale = 'en';
        }

        return route('admin.login', ['locale' => $locale]);
    }
}
