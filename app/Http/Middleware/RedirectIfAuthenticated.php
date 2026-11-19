<?php

namespace  App\Http\Middleware;

use App\Models\Admin;
use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $locale = $request->route('locale')
                    ?? $request->cookie('locale')
                    ?? ($request->hasSession() ? $request->session()->get('locale') : null)
                    ?? $request->getPreferredLanguage(['en', 'ar'])
                    ?? app()->getLocale()
                    ?? config('app.locale', 'en');

                if (!in_array($locale, ['en', 'ar'], true)) {
                    $locale = 'en';
                }

                return redirect("/{$locale}");
            }
        }

        return $next($request);
    }
}
