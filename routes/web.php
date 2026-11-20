<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardRouterController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\DeviceTypeController;
use App\Http\Controllers\DeviceUserController;
use App\Http\Controllers\InspectorController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\LocationInspectorController;
use App\Http\Controllers\MonitorController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SupervisorController;
use App\Http\Controllers\SystemAuditLogController;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\AdminAuthorization;
use App\Http\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Action, Data Fetching & Mutation Routes (Language Middleware OMITTED)
|--------------------------------------------------------------------------
| No {locale} parameter in URLs. Clean signatures, zero route-binding conflicts.
*/

Route::middleware(['admin.auth'])->group(function () {
    // JSON Data Endpoints
    Route::get('/employee/data', [DashboardRouterController::class, 'employeeData'])->name('admin.employee.data');
    Route::get('/admin/dashboard/data', [DashboardRouterController::class, 'adminData'])->name('admin.dashboard.data');
    Route::get('/audit-logs/data', [SystemAuditLogController::class, 'data'])->name('admin.audit-logs.data');
    Route::get('/supervisor/data', [SupervisorController::class, 'data'])->name('admin.supervisor.data');
    Route::get('/inspector/data', [InspectorController::class, 'data'])->name('admin.inspector.data');
    Route::get('/monitor/data', [MonitorController::class, 'data'])->name('admin.monitor.data');

    // Workflow Actions (Supervisor & Inspector)
    Route::post('/supervisor/tests/{patientHeader}/confirm', [SupervisorController::class, 'confirm'])->name('admin.supervisor.confirm');
    Route::post('/supervisor/tests/{patientHeader}/reject', [SupervisorController::class, 'reject'])->name('admin.supervisor.reject');
    Route::post('/inspector/tests/{patientHeader}/accept', [InspectorController::class, 'accept'])->name('admin.inspector.accept');
    Route::post('/inspector/tests/{patientHeader}/reject', [InspectorController::class, 'reject'])->name('admin.inspector.reject');

    // Test File Actions & Direct Streaming Downloads
    Route::post('/tests/{patient}/file', [PatientController::class, 'uploadFile'])->name('admin.tests.file.upload');
    Route::get('/tests/{patient}/file/view', [PatientController::class, 'viewFile'])->name('admin.tests.file.view');
    Route::get('/tests/{patient}/file/download', [PatientController::class, 'downloadFile'])->name('admin.tests.file.download');
    Route::delete('/tests/{patient}/file', [PatientController::class, 'deleteFile'])->name('admin.tests.file.delete');

    // Users CRUD
    Route::post('/users/add', [AdminController::class, 'store'])->name('admin.users.store');
    Route::post('/users/validate/email/{id?}', [AdminController::class, 'validateEmail'])->name('admin.users.validate.email');
    Route::patch('/users/upload/{user}', [AdminController::class, 'upload'])->name('admin.users.upload');
    Route::patch('/users/{user}', [AdminController::class, 'update'])->name('admin.users.update');

    // Locations CRUD
    Route::post('/locations/add', [LocationController::class, 'store'])->name('admin.locations.store');
    Route::post('/locations/validate/code/{id?}', [LocationController::class, 'validateCode'])->name('admin.locations.validate.code');
    Route::patch('/locations/{location}', [LocationController::class, 'update'])->name('admin.locations.update');
    Route::patch('/locations/{location}/toggle-active', [LocationController::class, 'toggleActive'])->name('admin.locations.toggle-active');

    // Device Types CRUD
    Route::post('/device-types/add', [DeviceTypeController::class, 'store'])->name('admin.device-types.store');
    Route::patch('/device-types/{deviceType}', [DeviceTypeController::class, 'update'])->name('admin.device-types.update');
    Route::patch('/device-types/{deviceType}/toggle-active', [DeviceTypeController::class, 'toggleActive'])->name('admin.device-types.toggle-active');

    // Devices CRUD
    Route::post('/devices/add', [DeviceController::class, 'store'])->name('admin.devices.store');
    Route::post('/devices/validate/code/{id?}', [DeviceController::class, 'validateCode'])->name('admin.devices.validate.code');
    Route::patch('/devices/{device}', [DeviceController::class, 'update'])->name('admin.devices.update');
    Route::patch('/devices/{device}/toggle-active', [DeviceController::class, 'toggleActive'])->name('admin.devices.toggle-active');

    // Device User Assignments
    Route::post('/device-users/assign', [DeviceUserController::class, 'store'])->name('admin.device-users.store');
    Route::patch('/device-users/{deviceUser}/unassign', [DeviceUserController::class, 'unassign'])->name('admin.device-users.unassign');
    Route::patch('/device-users/{deviceUser}/reassign', [DeviceUserController::class, 'reassign'])->name('admin.device-users.reassign');

    // Location Inspector Assignments
    Route::post('/location-inspectors/assign', [LocationInspectorController::class, 'store'])->name('admin.location-inspectors.store');
    Route::patch('/location-inspectors/{locationInspector}/transfer', [LocationInspectorController::class, 'transfer'])->name('admin.location-inspectors.transfer');
    Route::patch('/location-inspectors/{locationInspector}/unassign', [LocationInspectorController::class, 'unassign'])->name('admin.location-inspectors.unassign');

    // Language Switcher Endpoint
    Route::post('/locale/{locale}', [LanguageController::class, 'switch'])->name('locale.switch');
});

// Authentication POST actions
Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('admin.store')->middleware(['language']);
Route::post('{locale}/login', [AuthenticatedSessionController::class, 'store'])->where(['locale' => 'en|ar'])->middleware(['language']);
Route::middleware([AdminAuthenticate::class, AdminAuthorization::class])->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

/*
|--------------------------------------------------------------------------
| Base URL & Redirect Routes (Language-Aware)
|--------------------------------------------------------------------------
| Redirect base '/' and bare '/login' taking the user's preferred or saved language into account.
*/

Route::get('/', function (\Illuminate\Http\Request $request) {
    $locale = $request->cookie('locale')
        ?? ($request->hasSession() ? $request->session()->get('locale') : null)
        ?? $request->getPreferredLanguage(['en', 'ar'])
        ?? config('app.locale', 'en');

    if (!in_array($locale, ['en', 'ar'], true)) {
        $locale = 'en';
    }

    if (\Illuminate\Support\Facades\Auth::check()) {
        return redirect("/{$locale}");
    }

    return redirect("/{$locale}/login");
});

Route::get('/login', function (\Illuminate\Http\Request $request) {
    $locale = $request->cookie('locale')
        ?? ($request->hasSession() ? $request->session()->get('locale') : null)
        ?? $request->getPreferredLanguage(['en', 'ar'])
        ?? config('app.locale', 'en');

    if (!in_array($locale, ['en', 'ar'], true)) {
        $locale = 'en';
    }

    return redirect("/{$locale}/login");
});

// Bare Page Routes Redirect to Locale Prefix
Route::middleware(['admin.auth'])->group(function () {
    Route::get('/tests/{patient}', function (\Illuminate\Http\Request $request, $patient) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/tests/{$patient}");
    });
    Route::get('/tests', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/tests");
    });
    Route::get('/devices/{device}', function (\Illuminate\Http\Request $request, $device) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/devices/{$device}");
    });
    Route::get('/devices', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/devices");
    });
    Route::get('/locations/{location}', function (\Illuminate\Http\Request $request, $location) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/locations/{$location}");
    });
    Route::get('/locations', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/locations");
    });
    Route::get('/device-types/{deviceType}', function (\Illuminate\Http\Request $request, $deviceType) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/device-types/{$deviceType}");
    });
    Route::get('/device-types', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/device-types");
    });
    Route::get('/users/{user}', function (\Illuminate\Http\Request $request, $user) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/users/{$user}");
    });
    Route::get('/users', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/users");
    });
    Route::get('/monitor', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/monitor");
    });
    Route::get('/audit-logs', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/audit-logs");
    });
    Route::get('/inspector/dashboard', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/inspector/dashboard");
    });
    Route::get('/supervisor/dashboard', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/supervisor/dashboard");
    });
    Route::get('/location-inspectors', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/location-inspectors");
    });
    Route::get('/device-users', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/device-users");
    });
    Route::get('/profile', function (\Illuminate\Http\Request $request) {
        $locale = $request->cookie('locale') ?? ($request->hasSession() ? $request->session()->get('locale') : null) ?? 'en';
        $locale = in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        return redirect("/{$locale}/profile");
    });
});

/*
|--------------------------------------------------------------------------
| Inertia Page View Routes (Language Middleware APPLIED)
|--------------------------------------------------------------------------
| URLs carry {locale} ('en' or 'ar') for clean UI display and bookmarking.
*/

Route::prefix('{locale}')
    ->where(['locale' => 'en|ar'])
    ->middleware(['language', 'admin.auth'])
    ->group(function () {
        Route::get('/', [DashboardRouterController::class, 'index'])->name('admin.home');
        Route::get('/monitor', [MonitorController::class, 'index'])->name('admin.monitor');
        Route::get('/tests', [PatientController::class, 'index'])->name('patient.test');
        Route::get('/tests/{patient}', [PatientController::class, 'show'])->name('patient.show');
        Route::get('/inspector/dashboard', [InspectorController::class, 'index'])->name('admin.inspector.dashboard');
        Route::get('/supervisor/dashboard', [SupervisorController::class, 'index'])->name('admin.supervisor.dashboard');
        Route::get('/audit-logs', [SystemAuditLogController::class, 'index'])->name('admin.audit-logs');

        // Location Pages
        Route::get('/locations', [LocationController::class, 'index'])->name('admin.locations');
        Route::get('/locations/add', [LocationController::class, 'create'])->name('admin.locations.add');
        Route::get('/locations/{location}', [LocationController::class, 'edit'])->name('admin.locations.edit');

        // Device Type Pages
        Route::get('/device-types', [DeviceTypeController::class, 'index'])->name('admin.device-types');
        Route::get('/device-types/add', [DeviceTypeController::class, 'create'])->name('admin.device-types.add');
        Route::get('/device-types/{deviceType}', [DeviceTypeController::class, 'edit'])->name('admin.device-types.edit');

        // Device Pages
        Route::get('/devices', [DeviceController::class, 'index'])->name('admin.devices');
        Route::get('/devices/add', [DeviceController::class, 'create'])->name('admin.devices.add');
        Route::get('/devices/{device}', [DeviceController::class, 'edit'])->name('admin.devices.edit');

        // Assignment Pages
        Route::get('/device-users', [DeviceUserController::class, 'index'])->name('admin.device-users');
        Route::get('/device-users/assign', [DeviceUserController::class, 'create'])->name('admin.device-users.assign');
        Route::get('/location-inspectors', [LocationInspectorController::class, 'index'])->name('admin.location-inspectors');

        // Users Pages
        Route::get('/users', [AdminController::class, 'index'])->name('admin.users');
        Route::get('/users/add', [AdminController::class, 'create'])->name('admin.users.add');
        Route::get('/users/{user}', [AdminController::class, 'edit'])->name('admin.users.edit');

        // Profile Page
        Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile.edit');
    });

// Guest Page
Route::prefix('{locale}')
    ->where(['locale' => 'en|ar'])
    ->middleware(['language', RedirectIfAuthenticated::class])
    ->group(function () {
        Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
    });

require __DIR__ . '/file.web.php';
