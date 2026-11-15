<?php

namespace App\Http\Controllers;

use App\Facades\PatientService\PatientHeaderService;
use App\Facades\PatientService\PatientTestService;
use App\Models\PatientHeader;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $patients = PatientHeaderService::getPatients($user);
        return Inertia::render('Admin/Patient/PatientList', [
            'patients' => $patients,
        ]);
    }

    public function show(Request $request, PatientHeader $patient): Response
    {
        $user = $request->user();
        if ($user) {
            $adminRef = $user->reference()->first();
            $role = strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');
            if ($role === 'employee') {
                $assignedDeviceIds = \App\Models\DeviceUser::query()
                    ->where('user_id', $user->id)
                    ->where('is_active', true)
                    ->pluck('device_id')
                    ->toArray();

                $patientDeviceId = $patient->DeviceId ?? $patient->device_id;
                if (!in_array($patientDeviceId, $assignedDeviceIds)) {
                    abort(403, 'Unauthorized access to test record.');
                }
            } elseif ($role === 'inspector') {
                $assignedLocationId = $user->getAssignedLocationId();
                $patientLocationId = $patient->device?->location_id;
                if (!$assignedLocationId || $patientLocationId !== $assignedLocationId) {
                    abort(403, 'Unauthorized access to test record outside your assigned location.');
                }
            }
        }

        return Inertia::render('Admin/Patient/PatientDetails', [
            'patient' => PatientHeaderService::mapPatientModel($patient),
        ]);
    }
}
