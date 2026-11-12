<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DeviceImportService\DeviceImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DeviceImportController extends Controller
{
    public function __construct(
        private DeviceImportService $deviceImportService
    ) {}

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'device_id' => ['nullable', 'integer'],

                'device_code' => ['nullable', 'string', 'max:100'],

                'file_name' => ['required', 'string', 'max:500'],

                'file_hash' => [
                    'required',
                    'string',
                    'regex:/^[a-fA-F0-9]{64}$/',
                ],

                'patient' => [
                    'required',
                    'array:test_operator,patient_id,donor_id,collection_site,cup_lot_number,date_time',
                ],

                'patient.test_operator' => [
                    'nullable', 'string', 'max:255',
                ],

                'patient.patient_id' => [
                    'required', 'string', 'max:255',
                ],

                'patient.donor_id' => [
                    'nullable', 'string', 'max:255',
                ],

                'patient.collection_site' => [
                    'nullable', 'string', 'max:255',
                ],

                'patient.cup_lot_number' => [
                    'nullable', 'string', 'max:255',
                ],

                'patient.date_time' => [
                    'nullable', 'date',
                ],

                'tests' => [
                    'required', 'array', 'min:1',
                ],

                'tests.*' => [
                    'required',
                    'array:substance,software_result,visual_result',
                ],

                'tests.*.substance' => [
                    'required', 'string', 'max:100',
                ],

                'tests.*.software_result' => [
                    'nullable', 'string', 'max:255',
                ],

                'tests.*.visual_result' => [
                    'nullable', 'string', 'max:255',
                ],
            ]);
        } catch (ValidationException $exception) {
            Log::channel('device')->warning(
                'Device import validation failed.',
                [
                    'event' => 'validation_failed',
                    'failed_fields' => array_keys(
                        $exception->errors()
                    ),
                    'ip' => $request->ip(),
                ]
            );

            throw $exception;
        }

        $validated['file_hash'] = strtolower(
            $validated['file_hash']
        );

        $deviceId = isset($validated['device_id']) ? (int) $validated['device_id'] : null;
        $deviceCode = $validated['device_code'] ?? null;

        $result = $this->deviceImportService->import(
            $validated,
            $deviceId,
            $deviceCode
        );

        $httpStatus = $result['duplicate'] ? 200 : 201;

        return response()->json($result, $httpStatus);
    }
}
