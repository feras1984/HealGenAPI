<?php

namespace App\Services\PatientService;

use App\Facades\DeviceService\DeviceService;
use App\Factories\PatientQuery\PatientQueryStrategyFactory;
use App\Models\Device;
use App\Models\File;
use App\Models\PatientHeader;
use App\Models\PatientTestAction;
use App\Facades\PatientService\PatientTestService;
use App\Services\SupervisorService\SupervisorService;
use Carbon\Carbon;

class PatientHeaderService
{
    public const DATETIME_FORMAT = 'M d, Y H:i:s';

    private function parseCarbon(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::make($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function formatTimestamp(mixed $value): ?string
    {
        $carbon = $this->parseCarbon($value);
        return $carbon ? $carbon->format(self::DATETIME_FORMAT) : null;
    }

    private function formatTimestampIso(mixed $value): ?string
    {
        $carbon = $this->parseCarbon($value);
        return $carbon ? $carbon->toIso8601String() : null;
    }

    private function formatElapsedDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }

        $days = intdiv($seconds, 86400);
        $hours = intdiv($seconds % 86400, 3600);
        $mins = intdiv($seconds % 3600, 60);

        if ($days > 0) {
            return $hours > 0 ? "{$days}d {$hours}h" : "{$days}d";
        }

        if ($hours > 0) {
            return $mins > 0 ? "{$hours}h {$mins}m" : "{$hours}h";
        }

        return "{$mins}m";
    }

    private function buildStageDelay(
        string $key,
        ?Carbon $start,
        ?Carbon $end,
        bool $isOngoing,
        int $thresholdSeconds
    ): ?array {
        if (!$start || !$end) {
            return null;
        }

        $diffSeconds = (int) $start->diffInSeconds($end, false);
        if ($diffSeconds < 0) {
            $diffSeconds = 0;
        }

        return [
            'key' => $key,
            'seconds' => $diffSeconds,
            'hours' => round($diffSeconds / 3600, 1),
            'formatted' => $this->formatElapsedDuration($diffSeconds),
            'isDelayed' => $diffSeconds >= $thresholdSeconds,
            'isOngoing' => $isOngoing,
        ];
    }

    private function buildDelaySummary(
        PatientHeader $patientHeader,
        ?PatientTestAction $inspectorAction,
        ?PatientTestAction $supervisorAction
    ): array {
        $thresholdHours = max(1, (int) config('healgen.delay_threshold_hours', 48));
        $thresholdSeconds = $thresholdHours * 3600;
        $now = Carbon::now();

        $deviceCapturedCarbon = $this->parseCarbon($patientHeader->DateTime);
        $receivedCarbon = $this->parseCarbon($patientHeader->CreatedAt);
        $inspectorCarbon = $inspectorAction ? $this->parseCarbon($inspectorAction->created_at) : null;
        $supervisorCarbon = $supervisorAction ? $this->parseCarbon($supervisorAction->created_at) : null;

        // Stage 1 -> 2: Captured -> Received
        $captureToReceive = $this->buildStageDelay(
            'capture_to_receive',
            $deviceCapturedCarbon,
            $receivedCarbon,
            false,
            $thresholdSeconds
        );

        // Stage 2 -> 3: Received -> Inspection
        // Skip ongoing inspection wait when an Expert has already made a direct final decision without an Inspector
        $receiveToInspection = null;
        if ($inspectorCarbon) {
            $receiveToInspection = $this->buildStageDelay(
                'receive_to_inspection',
                $receivedCarbon,
                $inspectorCarbon,
                false,
                $thresholdSeconds
            );
        } elseif (!$supervisorCarbon && in_array($patientHeader->Status, ['Imported', 'Awaiting Inspection'], true)) {
            $receiveToInspection = $this->buildStageDelay(
                'receive_to_inspection',
                $receivedCarbon,
                $now,
                true,
                $thresholdSeconds
            );
        }

        // Stage 3 -> 4: Inspection -> Supervision (Confirmation)
        $inspectionToSupervision = null;
        $supervisionStart = $inspectorCarbon ?? $receivedCarbon;
        if ($supervisorCarbon) {
            $inspectionToSupervision = $this->buildStageDelay(
                'inspection_to_supervision',
                $supervisionStart,
                $supervisorCarbon,
                false,
                $thresholdSeconds
            );
        } elseif (in_array($patientHeader->Status, ['Inspector Accepted', 'Awaiting Supervisor'], true)) {
            $inspectionToSupervision = $this->buildStageDelay(
                'inspection_to_supervision',
                $supervisionStart,
                $now,
                true,
                $thresholdSeconds
            );
        }

        $stages = [
            'captureToReceive' => $captureToReceive,
            'receiveToInspection' => $receiveToInspection,
            'inspectionToSupervision' => $inspectionToSupervision,
        ];

        $delayedStages = [];
        $maxDelaySeconds = 0;

        foreach ($stages as $stage) {
            if ($stage && $stage['isDelayed']) {
                $delayedStages[] = $stage['key'];
                if ($stage['seconds'] > $maxDelaySeconds) {
                    $maxDelaySeconds = $stage['seconds'];
                }
            }
        }

        return [
            'thresholdHours' => $thresholdHours,
            'hasDelay' => count($delayedStages) > 0,
            'delayedCount' => count($delayedStages),
            'maxDelayHours' => $maxDelaySeconds > 0 ? round($maxDelaySeconds / 3600, 1) : 0,
            'maxDelayFormatted' => $maxDelaySeconds > 0 ? $this->formatElapsedDuration($maxDelaySeconds) : null,
            'delayedStages' => $delayedStages,
            'stages' => $stages,
        ];
    }

    private function mapActionAttribution(?PatientTestAction $action): ?array
    {
        if (!$action) {
            return null;
        }

        $actionUser = $action->relationLoaded('user')
            ? $action->user
            : $action->user()->with('reference')->first();

        $displayName = $actionUser?->email ?? '';
        $role = $action->role ?? '';

        if ($actionUser && $actionUser->reference) {
            $ref = $actionUser->reference;
            $name = trim(($ref->first_name ?? '') . ' ' . ($ref->last_name ?? ''));
            if (!empty($name)) {
                $displayName = $name;
            }
            if (empty($role) && !empty($ref->role)) {
                $role = $ref->role;
            }
        }

        $formattedAt = $this->formatTimestamp($action->created_at) ?? '';

        return [
            'id' => $actionUser?->id,
            'name' => $displayName,
            'email' => $actionUser?->email ?? '',
            'role' => $role,
            'action' => $action->action,
            'at' => $formattedAt,
            'reviewedAt' => $formattedAt,
            'atIso' => $this->formatTimestampIso($action->created_at),
            'reason' => $action->reason ?? '',
        ];
    }

    /**
     * Build chronological test audit/history entries distinguishing Employee submission,
     * file attachment, Inspector actions, Expert review, and Expert Confirm/Reject decisions.
     */
    private function buildTestHistory(PatientHeader $patientHeader, ?File $file): array
    {
        $history = [];

        $receivedAt = $this->formatTimestamp($patientHeader->CreatedAt) ?? $this->formatTimestamp($patientHeader->DateTime) ?? '';
        $receivedIso = $this->formatTimestampIso($patientHeader->CreatedAt) ?? $this->formatTimestampIso($patientHeader->DateTime);

        $operatorName = trim((string) ($patientHeader->TestOperator ?? ''));
        if ($operatorName === '') {
            $operatorName = $patientHeader->DeviceCode
                ? "Device {$patientHeader->DeviceCode}"
                : 'Employee';
        }

        $history[] = [
            'id' => "submission-{$patientHeader->Id}",
            'type' => 'EMPLOYEE_SUBMISSION',
            'rawAction' => 'EMPLOYEE_SUBMISSION',
            'actorId' => null,
            'actorName' => $operatorName,
            'actorRole' => 'Employee',
            'previousStatus' => null,
            'newStatus' => 'Imported',
            'reason' => $patientHeader->DeviceCode ? "Device: {$patientHeader->DeviceCode}" : null,
            'isDirect' => false,
            'at' => $receivedAt,
            'atIso' => $receivedIso,
        ];

        if ($file) {
            $history[] = [
                'id' => "attachment-{$file->id}",
                'type' => 'FILE_UPLOADED',
                'rawAction' => 'TEST_FILE_UPLOADED',
                'actorId' => null,
                'actorName' => $operatorName,
                'actorRole' => 'Employee',
                'previousStatus' => null,
                'newStatus' => null,
                'reason' => $file->name,
                'isDirect' => false,
                'at' => $this->formatTimestamp($file->created_at) ?? '',
                'atIso' => $this->formatTimestampIso($file->created_at),
            ];
        }

        $actions = $patientHeader->relationLoaded('actions')
            ? $patientHeader->actions->sortBy('id')->values()
            : $patientHeader->actions()->with('user.reference')->orderBy('id', 'asc')->get();

        foreach ($actions as $act) {
            $attribution = $this->mapActionAttribution($act);
            $rawAction = (string) $act->action;

            $normalizedType = match ($rawAction) {
                'SUPERVISOR_CONFIRM', 'EXPERT_CONFIRM' => 'EXPERT_CONFIRM',
                'SUPERVISOR_REJECT', 'EXPERT_REJECT' => 'EXPERT_REJECT',
                default => $rawAction,
            };

            $isDirect = in_array($normalizedType, ['EXPERT_CONFIRM', 'EXPERT_REJECT'], true)
                && in_array($act->previous_status, SupervisorService::DIRECT_PENDING_STATUSES, true);

            $history[] = [
                'id' => "action-{$act->id}",
                'type' => $normalizedType,
                'rawAction' => $rawAction,
                'actorId' => $attribution['id'] ?? $act->user_id,
                'actorName' => $attribution['name'] ?? '',
                'actorRole' => $attribution['role'] ?? ($act->role ?? ''),
                'previousStatus' => $act->previous_status,
                'newStatus' => $act->new_status,
                'reason' => $act->reason !== null && $act->reason !== '' ? $act->reason : null,
                'isDirect' => $isDirect,
                'at' => $attribution['at'] ?? '',
                'atIso' => $attribution['atIso'] ?? null,
            ];
        }

        return $history;
    }

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
        foreach ($tests as $test) {
            $testsModel[] = PatientTestService::mapTestModel($test);
        }

        $inspectorAction = $patientHeader->relationLoaded('latestInspectorAction')
            ? $patientHeader->latestInspectorAction
            : $patientHeader->latestInspectorAction()->with('user.reference')->first();
        $inspectorData = $this->mapActionAttribution($inspectorAction);

        $supervisorAction = $patientHeader->relationLoaded('latestSupervisorAction')
            ? $patientHeader->latestSupervisorAction
            : $patientHeader->latestSupervisorAction()->with('user.reference')->first();
        $supervisorData = $this->mapActionAttribution($supervisorAction);

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
                'createdAt' => $this->formatTimestamp($file->created_at) ?? '',
            ];
        }

        $deviceCapturedAt = $this->formatTimestamp($patientHeader->DateTime);
        $receivedAt = $this->formatTimestamp($patientHeader->CreatedAt) ?? '';
        $capturedAt = $deviceCapturedAt ?? $receivedAt;
        $capturedAtIso = $this->formatTimestampIso($patientHeader->DateTime)
            ?? $this->formatTimestampIso($patientHeader->CreatedAt);

        $delaySummary = $this->buildDelaySummary($patientHeader, $inspectorAction, $supervisorAction);
        $history = $this->buildTestHistory($patientHeader, $file);
        $isDirectExpertDecision = $supervisorAction !== null && $inspectorAction === null;
        $canExpertDecide = in_array($patientHeader->Status, SupervisorService::PENDING_STATUSES, true);

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
            'inspectedBy' => $inspectorData,
            'confirmedBy' => $supervisorData,
            'attachment' => $attachment,
            'deviceCapturedAt' => $deviceCapturedAt,
            'capturedAt' => $capturedAt,
            'capturedAtIso' => $capturedAtIso,
            'receivedAt' => $receivedAt,
            'receivedAtIso' => $this->formatTimestampIso($patientHeader->CreatedAt),
            'inspectedAt' => $inspectorData ? $inspectorData['at'] : null,
            'confirmedAt' => $supervisorData ? $supervisorData['at'] : null,
            'createdAt' => $receivedAt,
            'delaySummary' => $delaySummary,
            'history' => $history,
            'isDirectExpertDecision' => $isDirectExpertDecision,
            'canExpertDecide' => $canExpertDecide,
        ];
    }

    public function getPatients(?\App\Models\User $user = null): array
    {
        $query = PatientHeader::query()->with([
            'device.location',
            'device.deviceType',
            'tests',
            'file',
            'latestInspectorAction.user.reference',
            'latestSupervisorAction.user.reference',
            'actions.user.reference',
        ]);

        $strategy = app(PatientQueryStrategyFactory::class)->make($user);
        $query = $strategy->apply($query);

        $patients = $query->orderBy('Id', 'desc')->get();
        $patientsModel = [];
        foreach ($patients as $patient) {
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
