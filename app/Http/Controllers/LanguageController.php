<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function switch(Request $request, string $locale): JsonResponse|RedirectResponse
    {
        if (!in_array($locale, ['en', 'ar'], true)) {
            $locale = 'en';
        }

        app()->setLocale($locale);
        if ($request->hasSession()) {
            $request->session()->put('locale', $locale);
        }
        cookie()->queue(cookie()->forever('locale', $locale));

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'locale' => $locale,
                'direction' => $locale === 'ar' ? 'rtl' : 'ltr',
            ]);
        }

        return redirect()->back();
    }
}
