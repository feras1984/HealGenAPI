<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\PatientController;

Route::group([], function () {
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::get('/patients/{id}/tests', [PatientController::class, 'tests']);
});


