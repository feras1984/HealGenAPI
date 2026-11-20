<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function switch(Request $request, ?string $locale = null): JsonResponse|RedirectResponse
    {
        $targetLocale = $locale ?? $request->route('locale') ?? $request->segment(2) ?? $request->input('locale') ?? 'en';

        if (!in_array($targetLocale, ['en', 'ar'], true)) {
            $targetLocale = 'en';
        }

        app()->setLocale($targetLocale);
        if ($request->hasSession()) {
            $request->session()->put('locale', $targetLocale);
        }
        cookie()->queue(cookie()->forever('locale', $targetLocale));

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'locale' => $targetLocale,
                'direction' => $targetLocale === 'ar' ? 'rtl' : 'ltr',
            ]);
        }

        return redirect()->back();
    }
}
