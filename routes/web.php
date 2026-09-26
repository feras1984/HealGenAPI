<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\AdminAuthorization;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Livewire\Dashboard;
use App\Livewire\Logs;
use App\Livewire\Tests\Details;
use App\Livewire\Tests\Tests;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Profiler\Profile;

//Route::get('/', Dashboard::class)
//    ->middleware(['auth', 'verified'])
//    ->name('home');
//
//Route::get('/dashboard', Dashboard::class)
//    ->middleware(['auth', 'verified'])
//    ->name('dashboard');
//
//Route::middleware('auth')->group(function () {
//    Route::get('/tests', Tests::class)
//    ->name('tests');
//    Route::get('/tests/{patientId}', Details::class)->name('tests.details');
//    Route::get('/logs', Logs::class)->name('logs');
//});
//
//require __DIR__.'/auth.php';

use App\Http\Controllers\LocationController;
use App\Http\Controllers\DeviceTypeController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\DeviceUserController;
use App\Http\Controllers\MonitorController;
use App\Http\Controllers\InspectorController;
use App\Http\Controllers\SupervisorController;
use App\Http\Controllers\DashboardRouterController;
use App\Http\Controllers\SystemAuditLogController;

Route::middleware(['language', 'admin.auth'])->get('/', [DashboardRouterController::class, 'index'])->name('admin.home');

Route::middleware(['admin.auth'])->group(function () {
    Route::get('/employee/data', [DashboardRouterController::class, 'employeeData'])->name('admin.employee.data');
    Route::get('/admin/dashboard/data', [DashboardRouterController::class, 'adminData'])->name('admin.dashboard.data');

    // Audit Log Routes
    Route::get('/audit-logs', [SystemAuditLogController::class, 'index'])->name('admin.audit-logs');
    Route::get('/audit-logs/data', [SystemAuditLogController::class, 'data'])->name('admin.audit-logs.data');
    // Supervisor Routes
    Route::get('/supervisor/dashboard', [SupervisorController::class, 'index'])->name('admin.supervisor.dashboard');
    Route::get('/supervisor/data', [SupervisorController::class, 'data'])->name('admin.supervisor.data');
    Route::post('/supervisor/tests/{patientHeader}/confirm', [SupervisorController::class, 'confirm'])->name('admin.supervisor.confirm');
    Route::post('/supervisor/tests/{patientHeader}/reject', [SupervisorController::class, 'reject'])->name('admin.supervisor.reject');

    // Inspector Routes
    Route::get('/inspector/dashboard', [InspectorController::class, 'index'])->name('admin.inspector.dashboard');
    Route::get('/inspector/data', [InspectorController::class, 'data'])->name('admin.inspector.data');
    Route::post('/inspector/tests/{patientHeader}/accept', [InspectorController::class, 'accept'])->name('admin.inspector.accept');
    Route::post('/inspector/tests/{patientHeader}/reject', [InspectorController::class, 'reject'])->name('admin.inspector.reject');

    // Monitor Routes
    Route::get('/monitor', [MonitorController::class, 'index'])->name('admin.monitor');
    Route::get('/monitor/data', [MonitorController::class, 'data'])->name('admin.monitor.data');

    Route::get('/tests', [PatientController::class, 'index'])->name('patient.test');
    Route::get('/tests/{patient}', [PatientController::class, 'show'])->name('patient.show');
    Route::get('/users', [AdminController::class, 'index'])->name('admin.users');
    Route::get('/users/add', [AdminController::class, 'create'])->name('admin.users.add');
    Route::post('/users/add', [AdminController::class, 'store'])->name('admin.users.store');
    Route::post('/users/validate/email/{id?}', [AdminController::class, 'validateEmail'])->name('admin.users.validate.email');
    Route::patch('/users/upload/{user}', [AdminController::class, 'upload'])->name('admin.users.upload');
    Route::get('/users/{user}', [AdminController::class, 'edit'])->name('admin.users.edit');
    Route::patch('/users/{user}', [AdminController::class, 'update'])->name('admin.users.update');

    // Location Routes
    Route::get('/locations', [LocationController::class, 'index'])->name('admin.locations');
    Route::get('/locations/add', [LocationController::class, 'create'])->name('admin.locations.add');
    Route::post('/locations/add', [LocationController::class, 'store'])->name('admin.locations.store');
    Route::post('/locations/validate/code/{id?}', [LocationController::class, 'validateCode'])->name('admin.locations.validate.code');
    Route::get('/locations/{location}', [LocationController::class, 'edit'])->name('admin.locations.edit');
    Route::patch('/locations/{location}', [LocationController::class, 'update'])->name('admin.locations.update');
    Route::patch('/locations/{location}/toggle-active', [LocationController::class, 'toggleActive'])->name('admin.locations.toggle-active');

    // Device Type Routes
    Route::get('/device-types', [DeviceTypeController::class, 'index'])->name('admin.device-types');
    Route::get('/device-types/add', [DeviceTypeController::class, 'create'])->name('admin.device-types.add');
    Route::post('/device-types/add', [DeviceTypeController::class, 'store'])->name('admin.device-types.store');
    Route::get('/device-types/{deviceType}', [DeviceTypeController::class, 'edit'])->name('admin.device-types.edit');
    Route::patch('/device-types/{deviceType}', [DeviceTypeController::class, 'update'])->name('admin.device-types.update');
    Route::patch('/device-types/{deviceType}/toggle-active', [DeviceTypeController::class, 'toggleActive'])->name('admin.device-types.toggle-active');

    // Device Routes
    Route::get('/devices', [DeviceController::class, 'index'])->name('admin.devices');
    Route::get('/devices/add', [DeviceController::class, 'create'])->name('admin.devices.add');
    Route::post('/devices/add', [DeviceController::class, 'store'])->name('admin.devices.store');
    Route::post('/devices/validate/code/{id?}', [DeviceController::class, 'validateCode'])->name('admin.devices.validate.code');
    Route::get('/devices/{device}', [DeviceController::class, 'edit'])->name('admin.devices.edit');
    Route::patch('/devices/{device}', [DeviceController::class, 'update'])->name('admin.devices.update');
    Route::patch('/devices/{device}/toggle-active', [DeviceController::class, 'toggleActive'])->name('admin.devices.toggle-active');

    // Device User Assignment Routes
    Route::get('/device-users', [DeviceUserController::class, 'index'])->name('admin.device-users');
    Route::get('/device-users/assign', [DeviceUserController::class, 'create'])->name('admin.device-users.assign');
    Route::post('/device-users/assign', [DeviceUserController::class, 'store'])->name('admin.device-users.store');
    Route::patch('/device-users/{deviceUser}/unassign', [DeviceUserController::class, 'unassign'])->name('admin.device-users.unassign');
    Route::patch('/device-users/{deviceUser}/reassign', [DeviceUserController::class, 'reassign'])->name('admin.device-users.reassign');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('admin.profile.edit');
});

Route::middleware([RedirectIfAuthenticated::class])->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('admin.login');
});

Route::middleware([AdminAuthenticate::class, AdminAuthorization::class])->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('admin.store');



require __DIR__ . '/file.web.php';
