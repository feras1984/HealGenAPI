<?php

namespace App\Services\PatientService;

use App\Facades\DeviceService\DeviceService;
use App\Models\Device;
use App\Models\PatientHeader;
use App\Facades\PatientService\PatientTestService;
use App\Services\PatientService;
use Carbon\Carbon;

class PatientHeaderService
{
    public function mapPatientModel(PatientHeader $patientHeader): array
    {
        $device = $patientHeader->device()->first();
        $deviceModel = $device ? DeviceService::mapDeviceModel($device) : null;

        $tests = $patientHeader->tests()->get();
        $testsModel = [];
        foreach ($tests as $test){
            $testsModel[] = PatientTestService::mapTestModel($test);
        }

        return [
            'id' => $patientHeader->Id,
            'patientId' => $patientHeader->PatientId,
            'donorId' => $patientHeader->DonorId,
            'collectionSite' => $patientHeader->CollectionSite,
            'cupLotNumber' => $patientHeader->CupLotNumber,
            'status' => $patientHeader->Status,
            'device' => $deviceModel,
            'tests' => $testsModel,
            'createdAt' => Carbon::make($patientHeader->CreatedAt)->format('M d, Y'),
        ];
    }

    public function getPatients(?\App\Models\User $user = null): array
    {
        $query = PatientHeader::query()->with(['device.location', 'device.deviceType']);

        if ($user) {
            $adminRef = $user->reference()->first();
            $role = strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');
            if ($role === 'employee') {
                $assignedDeviceIds = \App\Models\DeviceUser::query()
                    ->where('user_id', $user->id)
                    ->where('is_active', true)
                    ->pluck('device_id')
                    ->toArray();

                $query->whereIn('device_id', $assignedDeviceIds);
            }
        }

        $patients = $query->orderBy('Id', 'desc')->get();
        $patientsModel = [];
        foreach ($patients as $patient){
            $patientsModel[] = $this->mapPatientModel($patient);
        }

        return $patientsModel;
    }

    public function associateDevice(PatientHeader $patientHeader, ?string $deviceCode): void
    {
        $patientHeader->device_code = $deviceCode;

        if ($deviceCode) {
            $device = Device::where('device_code', $deviceCode)->first();
            if ($device) {
                $patientHeader->device_id = $device->id;
                if (!$device->is_active) {
                    $patientHeader->Status = 'Blocked';
                } else {
                    $patientHeader->Status = 'Imported';
                }
            } else {
                $patientHeader->device_id = null;
                $patientHeader->Status = 'Imported';
            }
        } else {
            $patientHeader->device_id = null;
        }

        $patientHeader->save();
    }
}
