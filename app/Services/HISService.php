<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class HISService
{
    protected string $baseUrl;
    protected string $apiKey;
    private PatientService $patientService;
    private HL7Service $hl7Service;

    public function __construct()
    {
        $this->baseUrl = config('services.his.base_url', 'http://his.local');
        $this->apiKey = config('services.his.api_key');
        $this->patientService = new PatientService();
        $this->hl7Service = new HL7Service();
    }

    public function pushPatient(array $payload): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Accept' => 'application/json',
        ])->post($this->baseUrl . '/patients', $payload);

        return [
            'success' => $response->successful(),
            'status' => $response->status(),
            'body' => $response->json(),
        ];
    }

    public function pushBatch(array $patients): array
    {
        return collect($patients)->map(function ($patient) {
            return $this->pushPatient($patient);
        })->toArray();
    }

    public function pushHL7(string $hl7Message): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/hl7-v2',
        ])->post($this->baseUrl . '/hl7', [
            'message' => $hl7Message,
        ]);

        return [
            'success' => $response->successful(),
            'status' => $response->status(),
            'body' => $response->body(),
        ];
    }

    public function sendPatient(int $patientHeaderId): array
    {
        $data = $this->patientService->getPatientForHIS($patientHeaderId);

        if (!$data) {

            logger()->warning('Patient not found', [
                'patient_header_id' => $patientHeaderId
            ]);

            return [
                'success' => false,
                'message' => 'Patient not found'
            ];
        }

        $hl7Message = $this->hl7Service->buildMessage(
            $data['patient'],
            $data['tests']
        );

        logger()->info('HL7 Message',
            ['HL7 Message' => $hl7Message]
        );

        logger()->info('HL7 generated', [
            'patient_header_id' => $patientHeaderId
        ]);

        $response = $this->pushHL7($hl7Message);

        logger()->info('HIS response received', [
            'patient_header_id' => $patientHeaderId,
            'success' => $response['success'] ?? false
        ]);

        if ($response['success']) {

            $this->patientService->markAsSentToHIS(
                $patientHeaderId
            );

            logger()->info('Patient marked as SentToHIS', [
                'patient_header_id' => $patientHeaderId
            ]);

        } else {

            $this->patientService->markAsFailedToSend(
                $patientHeaderId
            );

            logger()->warning('Patient marked as FailedToSend', [
                'patient_header_id' => $patientHeaderId
            ]);
        }

        return $response;
    }
}
