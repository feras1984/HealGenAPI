<?php

use App\Http\Controllers\ProfileController;
use App\Livewire\Dashboard;
use App\Livewire\Logs;
use App\Livewire\Tests\Details;
use App\Livewire\Tests\Tests;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Profiler\Profile;

Route::get('/', Dashboard::class)
    ->middleware(['auth', 'verified'])
    ->name('home');

Route::get('/dashboard', Dashboard::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/tests', Tests::class)
    ->name('tests');
    Route::get('/tests/{patientId}', Details::class)->name('tests.details');
    Route::get('/logs', Logs::class)->name('logs');
});

require __DIR__.'/auth.php';
