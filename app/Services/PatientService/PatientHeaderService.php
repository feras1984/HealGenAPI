<?php

namespace App\Services\PatientService;

use App\Facades\DeviceService\DeviceService;
use App\Factories\PatientQuery\PatientQueryStrategyFactory;
use App\Models\Device;
use App\Models\PatientHeader;
use App\Facades\PatientService\PatientTestService;
use App\Services\PatientService;
use Carbon\Carbon;

class PatientHeaderService
{
    public function mapPatientModel(PatientHeader $patientHeader): array
    {
        $device = $patientHeader->relationLoaded('device')
            ? $patientHeader->device
            : $patientHeader->device()->first();
        $deviceModel = $device ? DeviceService::mapDeviceModel($device) : null;

        $tests = $patientHeader->relationLoaded('tests')
            ? $patientHeader->tests
            : $patientHeader->tests()->get();
        $testsModel = [];
        foreach ($tests as $test){
            $testsModel[] = PatientTestService::mapTestModel($test);
        }

        $inspectorAction = $patientHeader->relationLoaded('latestInspectorAction')
            ? $patientHeader->latestInspectorAction
            : $patientHeader->latestInspectorAction()->with('user.reference')->first();

        $inspectorData = null;
        if ($inspectorAction) {
            $inspUser = $inspectorAction->user;
            $inspName = $inspUser?->email ?? '';
            if ($inspUser && $inspUser->reference) {
                $ref = $inspUser->reference;
                $name = trim(($ref->first_name ?? '') . ' ' . ($ref->last_name ?? ''));
                if (!empty($name)) {
                    $inspName = $name;
                }
            }
            $inspectorData = [
                'id' => $inspUser?->id,
                'name' => $inspName,
                'email' => $inspUser?->email ?? '',
                'action' => $inspectorAction->action,
                'reviewedAt' => $inspectorAction->created_at ? Carbon::make($inspectorAction->created_at)->format('M d, Y H:i') : '',
                'reason' => $inspectorAction->reason ?? '',
            ];
        }

        $file = $patientHeader->relationLoaded('file')
            ? $patientHeader->file
            : $patientHeader->file()->first();

        $attachment = null;
        if ($file) {
            $attachment = [
                'id' => $file->id,
                'name' => $file->name,
                'url' => route('admin.tests.file.view', $patientHeader->Id),
                'downloadUrl' => route('admin.tests.file.download', $patientHeader->Id),
                'isImage' => (bool) $file->is_image,
                'description' => $file->description,
                'createdAt' => $file->created_at ? Carbon::make($file->created_at)->format('M d, Y H:i') : '',
            ];
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
            'reviewedBy' => $inspectorData,
            'attachment' => $attachment,
            'createdAt' => Carbon::make($patientHeader->CreatedAt)->format('M d, Y'),
        ];
    }

    public function getPatients(?\App\Models\User $user = null): array
    {
        $query = PatientHeader::query()->with(['device.location', 'device.deviceType', 'file']);

        $strategy = app(PatientQueryStrategyFactory::class)->make($user);
        $query = $strategy->apply($query);

        $patients = $query->orderBy('Id', 'desc')->get();
        $patientsModel = [];
        foreach ($patients as $patient){
            $patientsModel[] = $this->mapPatientModel($patient);
        }

        return $patientsModel;
    }

    public function associateDevice(PatientHeader $patientHeader, ?string $deviceCode): void
    {
        $patientHeader->DeviceCode = $deviceCode;

        if ($deviceCode) {
            $device = Device::where('device_code', $deviceCode)->first();
            if ($device) {
                $patientHeader->DeviceId = $device->id;
                if (!$device->is_active) {
                    $patientHeader->Status = 'Blocked';
                } else {
                    $patientHeader->Status = 'Imported';
                }
            } else {
                $patientHeader->DeviceId = null;
                $patientHeader->Status = 'Imported';
            }
        } else {
            $patientHeader->DeviceId = null;
        }

        $patientHeader->save();
    }
}
