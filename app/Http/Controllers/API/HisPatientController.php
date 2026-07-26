<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\PatientTestsRequest;
use App\Http\Requests\PendingPatientsRequest;
use App\Http\Requests\MarkPatientSentRequest;
use App\Services\HISService;
use App\Services\HL7Service;
use App\Services\PatientService;
use App\Jobs\SendPatientToHISJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Request;
use Symfony\Component\HttpFoundation\Response;

class HisPatientController
{
    private HISService $hisService;
    public function __construct(
        private PatientService $patientService
    ) {}

    // =====================================================
    // GET: Pending Patients (HIS Pull API)
    // =====================================================
    public function pending(PendingPatientsRequest $request): JsonResponse
    {
        $data = $this->patientService->getPendingPatients(
            $request->validated(),
            min($request->per_page ?? 50, 200)
        );

        return response()->json([
            'success' => true,
            'message' => null,
            'data' => $data,
        ]);
    }

    // =====================================================
    // GET: Pending Patient By Id
    // =====================================================

    public function show(int $id): JsonResponse
    {
        $patient = $this->patientService->getPatientById($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => null,
            'data' => $patient
        ]);
    }

    // =====================================================
    // POST: Send Patient to HIS (Async Job)
    // =====================================================
    public function sendToHIS(MarkPatientSentRequest $request): JsonResponse
    {
        $id = $request->patient_header_id;

        // optional: validate existence inside service
        $patientExists = $this->patientService->exists($id);

        if (!$patientExists) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found',
            ], 404);
        }

        // Dispatch Job (no DB logic here)
        SendPatientToHISJob::dispatch($id);

        return response()->json([
            'success' => true,
            'message' => 'Queued for HIS delivery',
            'data' => [
                'patient_header_id' => $id,
                'status' => 'Queued',
            ],
        ]);
    }

    // =====================================================
    // GET: Patient Tests
    // =====================================================
    public function tests(int $id): JsonResponse
    {
        $data = $this->patientService->getPatientTests($id);

        return response()->json([
            'success' => true,
            'message' => null,
            'data' => $data
        ]);
    }

    public function markSent(int $id): JsonResponse
    {
        $updated = $this->patientService->markAsSentToHIS($id);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patient marked as SentToHIS'
        ]);
    }

    public function markFailed(int $id): JsonResponse
    {
        $updated = $this->patientService->markAsFailedToSend($id);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patient marked as FailedToSend'
        ]);
    }

    public function ack(Request $request): JsonResponse
    {
        logger()->info('HIS ACK received', [
            'payload' => $request->all()
        ]);

        $request->validate([
            'patient_header_id' => 'required|integer',
            'status' => 'required|string', // AA / AE
            'his_reference' => 'nullable|string'
        ]);

        $id = $request->patient_header_id;

        if ($request->status === 'AA') {

            $updated = $this->patientService->markAsSentToHIS(
                $id,
                $request->his_reference
            );

            logger()->info('HIS ACK SUCCESS processed', [
                'patient_header_id' => $id,
                'his_reference' => $request->his_reference
            ]);

        } else {

            $updated = $this->patientService->markAsFailedToSend($id);

            logger()->warning('HIS ACK FAILED processed', [
                'patient_header_id' => $id,
                'status' => $request->status
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'ACK processed'
        ]);
    }

//    use Illuminate\Http\JsonResponse;

    public function send(int $id): JsonResponse
    {
//        logger()->info('Sending patient to HIS', [
//            'patient_header_id' => $id
//        ]);
//
//        $result = $this->hisService->sendPatient($id);
//
//        return response()->json($result);
        if (!$this->patientService->exists($id)) {

            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }

        SendPatientToHISJob::dispatch($id);

        logger()->info('Patient queued for HIS delivery', [
            'patient_header_id' => $id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Patient queued for HIS delivery',
            'data' => [
                'patient_header_id' => $id
            ]
        ]);
    }
}
