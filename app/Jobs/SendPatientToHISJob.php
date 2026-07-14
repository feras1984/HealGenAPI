<?php

namespace App\Jobs;

use App\Services\PatientService;
use App\Services\HL7Service;
use App\Services\HISService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPatientToHISJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(
        public int $patientHeaderId
    ) {}

    public function handle(
        PatientService $patientService,
        HL7Service $hl7Service,
        HISService $hisService
    ): void {
        logger()->info('HIS Job started', [
            'patient_header_id' => $this->patientHeaderId
        ]);

        // 1. Load data
        $data = $patientService->getPatientForHIS($this->patientHeaderId);

        if (!$data) {
            logger()->warning('Patient not found', [
                'patient_header_id' => $this->patientHeaderId
            ]);
            return;
        }

        $patient = $data['patient'];
        $tests   = $data['tests'];

        logger()->info('Patient loaded for HIS', [
            'patient_header_id' => $this->patientHeaderId,
            'tests_count' => count($tests)
        ]);

        // 2. Build HL7
        $hl7Message = $hl7Service->buildMessage($patient, $tests);

        logger()->info('HL7 message built', [
            'patient_header_id' => $this->patientHeaderId,
            'hl7_size' => strlen($hl7Message)
        ]);

        // 3. Send to HIS
        logger()->info('Sending patient to HIS', [
            'id' => $this->patientHeaderId
        ]);

        $response = $hisService->pushHL7($hl7Message);

        logger()->info('HIS response received', [
            'patient_header_id' => $this->patientHeaderId,
            'status' => $response['status']
        ]);

        // 4. Handle result
        if ($response['success']) {

            $patientService->markAsSentToHIS(
                $this->patientHeaderId,
                $response['body'] ?? null
            );

            logger()->info('Patient marked as SentToHIS', [
                'patient_header_id' => $this->patientHeaderId
            ]);

        } else {

            logger()->error('HIS push failed', [
                'patient_header_id' => $this->patientHeaderId,
                'status' => $response['status'],
                'response' => $response['body'] ?? null
            ]);

            throw new \Exception('HIS push failed');
        }
    }

    public function failed(\Throwable $e): void
    {
        logger()->error('HIS Job failed permanently', [
            'patient_header_id' => $this->patientHeaderId,
            'error' => $e->getMessage()
        ]);

        app(PatientService::class)
            ->markAsFailedToSend($this->patientHeaderId);
    }
}
