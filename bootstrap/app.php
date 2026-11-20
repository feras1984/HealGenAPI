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
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: [
            'locale',
        ]);
        $middleware->web(append: [
            Language::class,
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
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            // 401 Unauthorized
            if ($status === Response::HTTP_UNAUTHORIZED) {
                if ($request->wantsJson() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'status' => false,
                        'message' => trans('errors.401_message'),
                    ], Response::HTTP_UNAUTHORIZED);
                }

                return Inertia::render('Admin/Errors/Unauthorized', [
                    'status' => 401,
                    'title' => trans('errors.401_title'),
                    'message' => trans('errors.401_message'),
                    'support' => trans('errors.401_support'),
                ])->toResponse($request)->setStatusCode(Response::HTTP_UNAUTHORIZED);
            }

            // 403 Forbidden
            if ($status === Response::HTTP_FORBIDDEN) {
                if ($request->wantsJson() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'status' => false,
                        'message' => trans('errors.403_message'),
                    ], Response::HTTP_FORBIDDEN);
                }

                return Inertia::render('Admin/Errors/Forbidden', [
                    'status' => 403,
                    'title' => trans('errors.403_title'),
                    'message' => trans('errors.403_message'),
                    'support' => trans('errors.403_support'),
                ])->toResponse($request)->setStatusCode(Response::HTTP_FORBIDDEN);
            }

            // 404 Not Found
            if ($status === Response::HTTP_NOT_FOUND) {
                if ($request->wantsJson() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'status' => false,
                        'message' => trans('errors.404_message'),
                    ], Response::HTTP_NOT_FOUND);
                }

                return Inertia::render('Admin/Errors/NotFound', [
                    'status' => 404,
                    'title' => trans('errors.404_title'),
                    'message' => trans('errors.404_message'),
                    'support' => trans('errors.404_support'),
                ])->toResponse($request)->setStatusCode(Response::HTTP_NOT_FOUND);
            }

            // 500 Internal Server Error
            if ($status === Response::HTTP_INTERNAL_SERVER_ERROR || $status === 500) {
                if ($request->wantsJson() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'status' => false,
                        'message' => config('app.debug') ? $exception->getMessage() : trans('errors.500_message'),
                    ], Response::HTTP_INTERNAL_SERVER_ERROR);
                }

                if (!config('app.debug') || $request->header('X-Inertia')) {
                    return Inertia::render('Admin/Errors/ServerError', [
                        'status' => 500,
                        'title' => trans('errors.500_title'),
                        'message' => trans('errors.500_message'),
                        'support' => trans('errors.500_support'),
                    ])->toResponse($request)->setStatusCode(Response::HTTP_INTERNAL_SERVER_ERROR);
                }
            }

            return $response;
        });

        $exceptions->render(function (
            ValidationException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
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
            if (!$request->is('api/*')) {
                return null;
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
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
