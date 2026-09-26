<?php

namespace App\Services\SupervisorService;

use App\Models\PatientHeader;
use App\Models\PatientTestAction;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use App\Jobs\SendPatientToHISJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SupervisorService
{
    /**
     * Statuses awaiting supervisor confirmation.
     */
    public const PENDING_STATUSES = ['Inspector Accepted', 'Awaiting Supervisor'];

    /**
     * Get KPI summary counts for Supervisor dashboard.
     */
    public function getDashboardKPIs(): array
    {
        $pendingCount = PatientHeader::query()
            ->whereIn('Status', self::PENDING_STATUSES)
            ->count();

        $today = Carbon::today();

        $confirmedTodayCount = PatientTestAction::query()
            ->where('action', 'SUPERVISOR_CONFIRM')
            ->whereDate('created_at', $today)
            ->count();

        $rejectedTodayCount = PatientTestAction::query()
            ->where('action', 'SUPERVISOR_REJECT')
            ->whereDate('created_at', $today)
            ->count();

        return [
            'pendingCount' => $pendingCount,
            'confirmedTodayCount' => $confirmedTodayCount,
            'rejectedTodayCount' => $rejectedTodayCount,
            'processedTodayCount' => $confirmedTodayCount + $rejectedTodayCount,
        ];
    }

    /**
     * Get tests in the Pending Supervisor Queue.
     */
    public function getPendingQueue(array $filters = [], int $limit = 50): array
    {
        $query = PatientHeader::with(['device.location', 'device.deviceType', 'tests'])
            ->whereIn('Status', self::PENDING_STATUSES);

        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('device_id', $filters['deviceId']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('CreatedAt', $filters['date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('PatientId', 'like', "%{$search}%")
                  ->orWhere('DonorId', 'like', "%{$search}%")
                  ->orWhere('CollectionSite', 'like', "%{$search}%")
                  ->orWhere('device_code', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('Id', 'asc')->limit($limit)->get();

        $list = [];
        foreach ($patients as $patient) {
            $list[] = PatientHeaderService::mapPatientModel($patient);
        }

        return $list;
    }

    /**
     * Get recent supervisor actions logged by the specified user.
     */
    public function getRecentActivity(int $userId, int $limit = 10): array
    {
        $actions = PatientTestAction::with('patientHeader')
            ->where('user_id', $userId)
            ->whereIn('action', ['SUPERVISOR_CONFIRM', 'SUPERVISOR_REJECT'])
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();

        $list = [];
        foreach ($actions as $act) {
            $header = $act->patientHeader;
            $list[] = [
                'id' => $act->id,
                'patientHeaderId' => $act->patient_header_id,
                'patientCode' => $header ? $header->PatientId : '',
                'donorName' => $header ? $header->DonorId : '',
                'action' => $act->action,
                'previousStatus' => $act->previous_status,
                'newStatus' => $act->new_status,
                'reason' => $act->reason ?? '',
                'createdAt' => Carbon::make($act->created_at)->format('M d, Y H:i'),
            ];
        }

        return $list;
    }

    /**
     * Check if user has Supervisor or Administrator authorization.
     */
    public function checkSupervisorAuthorization(User $user): void
    {
        $adminRef = $user->reference()->first();
        $role = strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');
        if (!in_array($role, ['supervisor', 'administrator'], true)) {
            throw new \Illuminate\Auth\Access\AuthorizationException("Unauthorized action. Only Supervisors or Administrators can confirm or reject tests.");
        }
    }

    /**
     * Supervisor Confirm Action with backend status validation, DB transaction, and HIS dispatch.
     */
    public function confirmTest(PatientHeader $patientHeader, User $user, ?string $note = null): array
    {
        $this->checkSupervisorAuthorization($user);

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending supervisor review. Current status: {$patientHeader->Status}");
        }

        $result = DB::transaction(function () use ($patientHeader, $user, $note) {
            $previousStatus = $patientHeader->Status;
            $newStatus = 'Confirmed';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Supervisor';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => 'SUPERVISOR_CONFIRM',
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => $note ? trim($note) : null,
            ]);

            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                'SUPERVISOR_CONFIRM',
                'PatientHeader',
                (string) $patientHeader->Id,
                "Confirmed test #{$patientHeader->Id} & dispatched to HIS. Status changed from {$previousStatus} to {$newStatus}."
            );

            return [
                'test' => PatientHeaderService::mapPatientModel($patientHeader),
                'kpis' => $this->getDashboardKPIs(),
            ];
        });

        // Dispatch background job to push confirmed result to HIS
        try {
            SendPatientToHISJob::dispatch($patientHeader->Id);
        } catch (\Throwable $e) {
            logger()->error("Failed to dispatch SendPatientToHISJob for test #{$patientHeader->Id}: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Supervisor Reject Action with mandatory reason validation, status validation & DB transaction.
     */
    public function rejectTest(PatientHeader $patientHeader, User $user, string $reason): array
    {
        $this->checkSupervisorAuthorization($user);

        $trimmedReason = trim($reason);
        if (empty($trimmedReason)) {
            throw new InvalidArgumentException("A rejection reason is required.");
        }

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending supervisor review. Current status: {$patientHeader->Status}");
        }

        return DB::transaction(function () use ($patientHeader, $user, $trimmedReason) {
            $previousStatus = $patientHeader->Status;
            $newStatus = 'Supervisor Rejected';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Supervisor';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => 'SUPERVISOR_REJECT',
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => $trimmedReason,
            ]);

            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                'SUPERVISOR_REJECT',
                'PatientHeader',
                (string) $patientHeader->Id,
                "Rejected test #{$patientHeader->Id}. Reason: {$trimmedReason}."
            );

            return [
                'test' => PatientHeaderService::mapPatientModel($patientHeader),
                'kpis' => $this->getDashboardKPIs(),
            ];
        });
    }

    /**
     * Get Supervisor activity chart data (breakdown and trend).
     */
    public function getActivityChart(int $userId): array
    {
        $today = Carbon::today();

        $confirmCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->where('action', 'SUPERVISOR_CONFIRM')
            ->whereDate('created_at', $today)
            ->count();

        $rejectCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->where('action', 'SUPERVISOR_REJECT')
            ->whereDate('created_at', $today)
            ->count();

        // Hourly actions today
        $raw = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereIn('action', ['SUPERVISOR_CONFIRM', 'SUPERVISOR_REJECT'])
            ->whereDate('created_at', $today)
            ->select(
                'action',
                DB::raw('DATEPART(hour, created_at) as hr'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('action', DB::raw('DATEPART(hour, created_at)'))
            ->get();

        $hourlyConfirm = [];
        $hourlyReject = [];
        foreach ($raw as $row) {
            $h = (int) $row->hr;
            if ($row->action === 'SUPERVISOR_CONFIRM') {
                $hourlyConfirm[$h] = (int) $row->count;
            } else {
                $hourlyReject[$h] = (int) $row->count;
            }
        }

        $trend = [];
        for ($h = 0; $h < 24; $h++) {
            $label = sprintf('%02d:00', $h);
            $trend[] = [
                'period' => $label,
                'confirmed' => $hourlyConfirm[$h] ?? 0,
                'rejected' => $hourlyReject[$h] ?? 0,
            ];
        }

        return [
            'breakdown' => [
                ['name' => 'Confirmed', 'count' => $confirmCount, 'color' => '#10b981'],
                ['name' => 'Rejected', 'count' => $rejectCount, 'color' => '#ef4444'],
            ],
            'trend' => $trend,
        ];
    }

    /**
     * Get aggregate dashboard payload for Supervisor.
     */
    public function getSupervisorDashboardData(User $user, array $filters = []): array
    {
        return [
            'kpis' => $this->getDashboardKPIs(),
            'pendingQueue' => $this->getPendingQueue($filters),
            'recentActivity' => $this->getRecentActivity($user->id),
            'activityChart' => $this->getActivityChart($user->id),
        ];
    }
}
