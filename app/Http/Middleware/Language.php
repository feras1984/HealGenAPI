<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class Language
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeLocale = $request->route('locale');
        $locale = $routeLocale
            ?? $request->cookie('locale')
            ?? ($request->hasSession() ? $request->session()->get('locale') : null)
            ?? $request->getPreferredLanguage(['en', 'ar'])
            ?? config('app.locale', 'en');

        if (!in_array($locale, ['en', 'ar'], true)) {
            $locale = 'en';
        }

        app()->setLocale($locale);
        URL::defaults(['locale' => $locale]);

        if ($request->hasSession()) {
            $request->session()->put('locale', $locale);
        }
        cookie()->queue(cookie()->forever('locale', $locale));

        if ($request->route() && $request->route()->hasParameter('locale')) {
            $request->route()->forgetParameter('locale');
        }

        return $next($request);
    }
}
