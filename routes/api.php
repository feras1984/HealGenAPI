<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\HisPatientController;

Route::prefix('his')
    ->middleware([
        'his.auth',
        'his.logger'
    ])
    ->group(function () {

    // Get pending patients
    Route::get(
        '/patients/pending',
        [HisPatientController::class, 'pending']
    );

    // Get patient details
    Route::get(
        '/patients/{id}',
        [HisPatientController::class, 'show']
    );

    // Get patient tests
    Route::get(
        '/patients/{id}/tests',
        [HisPatientController::class, 'tests']
    );

    // Mark patient as sent
    Route::post(
        '/patients/{id}/mark-sent',
        [HisPatientController::class, 'markSent']
    );

    // Mark patient as failed
    Route::post(
        '/patients/{id}/mark-failed',
        [HisPatientController::class, 'markFailed']
    );

    Route::post(
        '/ack',
        [HisPatientController::class, 'ack']
    );

    Route::post(
        '/patients/{id}/send',
        [HisPatientController::class, 'send']
    );
});

Route::
middleware('his.auth')
    ->get('/his/health', function () {

    try {
        DB::connection()->getPdo();

        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'disconnected';
    }

    return response()->json([
        'status' => 'ok',
        'db' => $dbStatus,
        'time' => now(),
    ]);
});


