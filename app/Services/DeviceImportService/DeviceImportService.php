<?php

namespace App\Services\DeviceImportService;

use App\Services\PatientService\TestAttachmentStorageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class DeviceImportService
{
    private TestAttachmentStorageService $attachmentStorageService;

    public function __construct(
        ?TestAttachmentStorageService $attachmentStorageService = null
    ) {
        $this->attachmentStorageService = $attachmentStorageService ?? new TestAttachmentStorageService();
    }

    public function import(
        array $payload,
        ?int $deviceId = null,
        ?string $deviceCode = null,
        ?UploadedFile $reportPdf = null
    ): array {
        $fileHash = strtolower($payload['file_hash']);

        if ($reportPdf !== null && !$this->attachmentStorageService->verifySha256($reportPdf, $fileHash)) {
            throw ValidationException::withMessages([
                'report_pdf' => ['The uploaded PDF SHA-256 hash does not match payload.file_hash.'],
            ]);
        }

        $storedPdfPath = null;

        try {
            // Fast duplicate check before any DB write or disk I/O.
            $existing = $this->findByFileHash($fileHash);

            if ($existing) {
                $this->logDuplicate($existing);

                return $this->duplicateResponse($existing);
            }

            $result = DB::transaction(function () use (
                $payload,
                $deviceId,
                $deviceCode,
                $fileHash,
                $reportPdf,
                &$storedPdfPath
            ) {
                // Recheck inside the transaction.
                $existing = $this->findByFileHash($fileHash);

                if ($existing) {
                    return $this->duplicateResponse($existing);
                }

                $attemptPdfPath = null;

                try {
                    $now = now();
                    $patient = $payload['patient'];
                    $status = 'Imported';

                    // Auto-resolve device details if one of them is missing
                    if (!$deviceId && $deviceCode) {
                        $device = DB::table('devices')->where('device_code', $deviceCode)->first();
                        if ($device) {
                            $deviceId = $device->id;
                            if (isset($device->is_active) && !$device->is_active) {
                                $status = 'Blocked';
                            }
                        }
                    } elseif ($deviceId) {
                        $device = DB::table('devices')->where('id', $deviceId)->first();
                        if ($device) {
                            if (!$deviceCode && isset($device->device_code)) {
                                $deviceCode = $device->device_code;
                            }
                            if (isset($device->is_active) && !$device->is_active) {
                                $status = 'Blocked';
                            }
                        }
                    }

                    // Update device last_seen_at timestamp if device is found
                    if ($deviceId) {
                        try {
                            DB::table('devices')
                                ->where('id', $deviceId)
                                ->update(['last_seen_at' => $now]);
                        } catch (Throwable) {
                            // Safe fallback if last_seen_at is unavailable
                        }
                    }

                    $patientHeaderId = DB::table('PatientHeader')
                        ->insertGetId([
                            'TestOperator' => $patient['test_operator'] ?? null,
                            'PatientId' => $patient['patient_id'],
                            'DonorId' => $patient['donor_id'] ?? null,
                            'CollectionSite' => $patient['collection_site'] ?? null,
                            'CupLotNumber' => $patient['cup_lot_number'] ?? null,
                            'DeviceId' => $deviceId,
                            'DeviceCode' => $deviceCode,
                            'DateTime' => $patient['date_time'] ?? null,
                            'SourceFile' => $payload['file_name'] ?? null,
                            'ProcessedAt' => $now,
                            'Status' => $status,
                            'FileHash' => $fileHash,
                            'ErrorMessage' => null,
                            'CreatedAt' => $now,
                            'UpdatedAt' => $now,
                        ], 'Id');

                    $tests = [];

                    foreach ($payload['tests'] as $test) {
                        $tests[] = [
                            'PatientHeaderId' => $patientHeaderId,
                            'Substance' => $test['substance'],
                            'SoftwareResult' => $test['software_result'] ?? null,
                            'VisualResult' => $test['visual_result'] ?? null,
                            'CreatedAt' => $now,
                            'UpdatedAt' => $now,
                        ];
                    }

                    DB::table('PatientTests')->insert($tests);

                    if ($reportPdf !== null) {
                        $this->attachmentStorageService->storePdfForImportedPatient(
                            (int) $patientHeaderId,
                            $reportPdf,
                            $payload['file_name'] ?? null,
                            $attemptPdfPath
                        );
                        $storedPdfPath = $attemptPdfPath;
                    }

                    return [
                        'success' => true,
                        'duplicate' => false,
                        'patient_header_id' => $patientHeaderId,
                        'tests_inserted' => count($tests),
                        'status' => $status,
                    ];
                } catch (Throwable $attemptException) {
                    if ($attemptPdfPath !== null) {
                        $this->attachmentStorageService->deleteStoredPath($attemptPdfPath);
                        if ($storedPdfPath === $attemptPdfPath) {
                            $storedPdfPath = null;
                        }
                    }

                    throw $attemptException;
                }
            }, 3);

            // Log only after the transaction has completed successfully.
            if ($result['duplicate']) {
                $this->logDuplicateById($result['patient_header_id']);

                return $result;
            }

            Log::channel('device')->info(
                'Device import completed successfully.',
                [
                    'event' => 'import_success',
                    'patient_header_id' => $result['patient_header_id'],
                    'tests_inserted' => $result['tests_inserted'],
                    'status' => $result['status'],
                    'has_pdf_attachment' => $reportPdf !== null,
                ]
            );

            return $result;

        } catch (QueryException $exception) {
            if ($storedPdfPath !== null) {
                $this->attachmentStorageService->deleteStoredPath($storedPdfPath);
                $storedPdfPath = null;
            }

            // Check whether another concurrent request imported this file.
            try {
                $existing = $this->findByFileHash($fileHash);
            } catch (Throwable $lookupException) {
                Log::channel('device')->error(
                    'Device import failed and duplicate verification also failed.',
                    [
                        'event' => 'database_error',
                        'exception_class' => get_class($exception),
                        'sql_state' => $exception->errorInfo[0] ?? null,
                        'verification_exception' => get_class($lookupException),
                    ]
                );

                throw $exception;
            }

            if ($existing) {
                $this->logDuplicate($existing);

                return $this->duplicateResponse($existing);
            }

            Log::channel('device')->error(
                'Device import database operation failed.',
                [
                    'event' => 'database_error',
                    'exception_class' => get_class($exception),
                    'sql_state' => $exception->errorInfo[0] ?? null,
                    'error_code' => $exception->getCode(),
                ]
            );

            throw $exception;

        } catch (Throwable $exception) {
            if ($storedPdfPath !== null) {
                $this->attachmentStorageService->deleteStoredPath($storedPdfPath);
                $storedPdfPath = null;
            }

            Log::channel('device')->error(
                'Unexpected device import error.',
                [
                    'event' => 'unexpected_error',
                    'exception_class' => get_class($exception),
                    'error_code' => $exception->getCode(),
                ]
            );

            throw $exception;
        }
    }

    private function findByFileHash(string $fileHash): ?object
    {
        return DB::table('PatientHeader')
            ->where('FileHash', $fileHash)
            ->first();
    }

    private function duplicateResponse(object $existing): array
    {
        return [
            'success' => true,
            'duplicate' => true,
            'patient_header_id' => $existing->Id,
            'tests_inserted' => 0,
            'status' => $existing->Status,
            'message' => 'This file has already been imported.',
        ];
    }

    private function logDuplicate(object $existing): void
    {
        $this->logDuplicateById($existing->Id);
    }

    private function logDuplicateById(int|string $patientHeaderId): void
    {
        Log::channel('device')->warning(
            'Duplicate device import detected.',
            [
                'event' => 'duplicate_import',
                'patient_header_id' => $patientHeaderId,
            ]
        );
    }
}
