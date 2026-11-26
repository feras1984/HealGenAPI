<?php

namespace App\Http\Controllers\API;

use App\Enums\IngestionSourceEnum;
use App\Http\Controllers\Controller;
use App\Services\DeviceImportService\DeviceImportService;
use App\Services\PatientService\TestAttachmentStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use JsonException;

class DeviceImportController extends Controller
{
    public function __construct(
        private DeviceImportService $deviceImportService,
        private TestAttachmentStorageService $attachmentStorageService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $isMultipart = $this->isMultipartPdfRequest($request);
        $reportPdf = null;

        try {
            if ($isMultipart) {
                [$validated, $reportPdf] = $this->validateMultipartPdfRequest($request);
            } else {
                $validated = $request->validate($this->payloadValidationRules());

                if (
                    isset($validated['ingestion_source'])
                    && $validated['ingestion_source'] !== IngestionSourceEnum::EXCEL->value
                ) {
                    throw ValidationException::withMessages([
                        'ingestion_source' => [
                            'Direct PDF ingestion requires a multipart/form-data request with report_pdf.',
                        ],
                    ]);
                }
            }
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

        $result = $isMultipart
            ? $this->deviceImportService->import(
                $validated,
                $deviceId,
                $deviceCode,
                $reportPdf
            )
            : $this->deviceImportService->import(
                $validated,
                $deviceId,
                $deviceCode
            );

        $httpStatus = $result['duplicate'] ? 200 : 201;

        return response()->json($result, $httpStatus);
    }

    private function isMultipartPdfRequest(Request $request): bool
    {
        $contentType = strtolower((string) $request->header('Content-Type', ''));

        if (str_starts_with($contentType, 'multipart/form-data')) {
            return true;
        }

        return !$request->isJson()
            && ($request->hasFile('report_pdf') || $request->exists('payload'));
    }

    /**
     * @return array{0: array<string, mixed>, 1: UploadedFile}
     *
     * @throws ValidationException
     */
    private function validateMultipartPdfRequest(Request $request): array
    {
        $errors = [];
        $decodedPayload = null;

        $rawPayload = $this->extractRawPayload($request);
        if ($rawPayload === null || trim($rawPayload) === '') {
            $errors['payload'][] = 'The payload field is required.';
        } else {
            try {
                $decoded = json_decode($rawPayload, true, 512, JSON_THROW_ON_ERROR);

                if (!is_array($decoded) || ($decoded !== [] && array_is_list($decoded))) {
                    $errors['payload'][] = 'The payload field must be a valid JSON object.';
                } else {
                    $decodedPayload = $decoded;
                }
            } catch (JsonException) {
                $errors['payload'][] = 'The payload field must contain valid JSON.';
            }
        }

        $pdfValidator = Validator::make(
            ['report_pdf' => $request->file('report_pdf')],
            [
                'report_pdf' => ['required', 'file', 'mimetypes:application/pdf', 'max:20480'],
            ]
        );

        if ($pdfValidator->fails()) {
            foreach ($pdfValidator->errors()->messages() as $field => $messages) {
                $errors[$field] = array_merge($errors[$field] ?? [], $messages);
            }
        }

        $reportPdf = $request->file('report_pdf');
        $pdfValidSoFar = !isset($errors['report_pdf']) && $reportPdf instanceof UploadedFile;

        if ($pdfValidSoFar && !$this->attachmentStorageService->hasValidPdfHeader($reportPdf)) {
            $errors['report_pdf'][] = 'The report_pdf file must have a valid %PDF- header.';
            $pdfValidSoFar = false;
        }

        $validatedPayload = null;
        if ($decodedPayload !== null) {
            $payloadValidator = Validator::make(
                $decodedPayload,
                $this->payloadValidationRules()
            );

            if ($payloadValidator->fails()) {
                foreach ($payloadValidator->errors()->messages() as $field => $messages) {
                    $errors[$field] = array_merge($errors[$field] ?? [], $messages);
                }
            } else {
                $validatedPayload = $payloadValidator->validated();
            }
        }

        if (
            $validatedPayload !== null
            && isset($validatedPayload['ingestion_source'])
            && $validatedPayload['ingestion_source'] !== IngestionSourceEnum::PDF->value
        ) {
            $errors['ingestion_source'][] = 'Multipart PDF ingestion must not specify ingestion_source as excel.';
        }

        if (
            $pdfValidSoFar
            && $validatedPayload !== null
            && !$this->attachmentStorageService->verifySha256($reportPdf, $validatedPayload['file_hash'])
        ) {
            $errors['report_pdf'][] = 'The uploaded PDF SHA-256 hash does not match payload.file_hash.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return [$validatedPayload, $reportPdf];
    }

    private function extractRawPayload(Request $request): ?string
    {
        if ($request->hasFile('payload')) {
            $payloadFile = $request->file('payload');
            if (!$payloadFile instanceof UploadedFile || !$payloadFile->isValid()) {
                return null;
            }

            $contents = @file_get_contents($payloadFile->getRealPath());

            return $contents === false ? null : $contents;
        }

        $payload = $request->input('payload');

        return is_string($payload) ? $payload : null;
    }

    private function payloadValidationRules(): array
    {
        return [
            'ingestion_source' => ['nullable', 'string', 'in:' . implode(',', IngestionSourceEnum::values())],

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
        ];
    }
}
