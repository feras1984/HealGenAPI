<?php

use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\AdminAuthorization;
use App\Http\Middleware\Authenticate;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HisApiAuth;
use App\Http\Middleware\HisRequestLogger;
use App\Http\Middleware\Language;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\ValidateSignature;
use Illuminate\Auth\Middleware\AuthenticateWithBasicAuth;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\SetCacheHeaders;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
//            App\Http\Kernel::class,
        ]);
        $middleware->alias([
            'his.auth' => HisApiAuth::class,
            'his.logger' => HisRequestLogger::class,
            'auth' => Authenticate::class,
            'admin.auth' => AdminAuthenticate::class,
            'auth.basic' => AuthenticateWithBasicAuth::class,
            'auth.session' => AuthenticateSession::class,
            'cache.headers' => SetCacheHeaders::class,
            'can' => Authorize::class,
            'guest' => RedirectIfAuthenticated::class,
            'password.confirm' => RequirePassword::class,
            'precognitive' => HandlePrecognitiveRequests::class,
            'signed' => ValidateSignature::class,
            'throttle' => ThrottleRequests::class,
            'verified' => EnsureEmailIsVerified::class,
            'language' => Language::class,
            'admin.permission' => AdminAuthorization::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
//        $exceptions->render(function (
//            ValidationException $e,
//            Request $request
//        ) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Validation failed',
//                'errors' => $e->errors(),
//                'data' => null,
//            ], Response::HTTP_UNPROCESSABLE_ENTITY);
//        });
//
//        $exceptions->render(function (
//            Throwable $e,
//            Request $request
//        ) {
//            if (! $request->is('api/*')) {
//                return null; // Let Laravel render normal web errors.
//            }
//
//            return response()->json([
//                'success' => false,
//                'message' => config('app.debug')
//                    ? $e->getMessage()
//                    : 'Internal server error.',
//                'data' => null,
//            ], Response::HTTP_INTERNAL_SERVER_ERROR);
//        });
        $exceptions->render(function (
            ValidationException $e,
            Request $request
        ) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'data' => null,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        });

        $exceptions->render(function (
            Throwable $e,
            Request $request
        ) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => config('app.debug')
                    ? $e->getMessage()
                    : 'Internal server error.',
                'data' => null,
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        });
    })->create();
