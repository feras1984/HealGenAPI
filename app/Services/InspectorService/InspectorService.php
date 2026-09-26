<?php

namespace App\Services\InspectorService;

use App\Models\PatientHeader;
use App\Models\PatientTestAction;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InspectorService
{
    /**
     * Pending inspection statuses.
     */
    public const PENDING_STATUSES = ['Imported', 'Awaiting Inspection'];

    /**
     * Get KPI summary counts for Inspector dashboard.
     */
    public function getDashboardKPIs(): array
    {
        $pendingCount = PatientHeader::query()
            ->whereIn('Status', self::PENDING_STATUSES)
            ->count();

        $today = Carbon::today();

        $acceptedTodayCount = PatientTestAction::query()
            ->where('action', 'INSPECTOR_ACCEPT')
            ->whereDate('created_at', $today)
            ->count();

        $rejectedTodayCount = PatientTestAction::query()
            ->where('action', 'INSPECTOR_REJECT')
            ->whereDate('created_at', $today)
            ->count();

        return [
            'pendingCount' => $pendingCount,
            'acceptedTodayCount' => $acceptedTodayCount,
            'rejectedTodayCount' => $rejectedTodayCount,
            'inspectedTodayCount' => $acceptedTodayCount + $rejectedTodayCount,
        ];
    }

    /**
     * Get tests in the Pending Inspection Queue.
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
     * Get recent inspector actions logged by the specified user.
     */
    public function getRecentActivity(int $userId, int $limit = 10): array
    {
        $actions = PatientTestAction::with('patientHeader')
            ->where('user_id', $userId)
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

    public function checkInspectorAuthorization(User $user): void
    {
        $adminRef = $user->reference()->first();
        $role = strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');
        if (!in_array($role, ['inspector', 'administrator'], true)) {
            throw new \Illuminate\Auth\Access\AuthorizationException("Unauthorized action. Only Inspectors or Administrators can accept or reject tests.");
        }
    }

    /**
     * Inspector Accept Action with backend status validation & DB transaction.
     */
    public function acceptTest(PatientHeader $patientHeader, User $user): array
    {
        $this->checkInspectorAuthorization($user);

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
        }

        return DB::transaction(function () use ($patientHeader, $user) {
            $previousStatus = $patientHeader->Status;
            $newStatus = 'Inspector Accepted';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Inspector';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => 'INSPECTOR_ACCEPT',
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => null,
            ]);

            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                'INSPECTOR_ACCEPT',
                'PatientHeader',
                (string) $patientHeader->Id,
                "Accepted test #{$patientHeader->Id}. Status changed from {$previousStatus} to {$newStatus}."
            );

            return [
                'test' => PatientHeaderService::mapPatientModel($patientHeader),
                'kpis' => $this->getDashboardKPIs(),
            ];
        });
    }

    /**
     * Inspector Reject Action with mandatory reason validation, status validation & DB transaction.
     */
    public function rejectTest(PatientHeader $patientHeader, User $user, string $reason): array
    {
        $this->checkInspectorAuthorization($user);

        $trimmedReason = trim($reason);
        if (empty($trimmedReason)) {
            throw new InvalidArgumentException("A rejection reason is required.");
        }

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
        }

        return DB::transaction(function () use ($patientHeader, $user, $trimmedReason) {
            $previousStatus = $patientHeader->Status;
            $newStatus = 'Inspector Rejected';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Inspector';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => 'INSPECTOR_REJECT',
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => $trimmedReason,
            ]);

            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                'INSPECTOR_REJECT',
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
     * Get Inspector activity chart data (breakdown and trend).
     */
    public function getActivityChart(int $userId): array
    {
        $today = Carbon::today();

        $acceptCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->where('action', 'INSPECTOR_ACCEPT')
            ->whereDate('created_at', $today)
            ->count();

        $rejectCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->where('action', 'INSPECTOR_REJECT')
            ->whereDate('created_at', $today)
            ->count();

        // Hourly actions today
        $raw = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])
            ->whereDate('created_at', $today)
            ->select(
                'action',
                DB::raw('DATEPART(hour, created_at) as hr'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('action', DB::raw('DATEPART(hour, created_at)'))
            ->get();

        $hourlyAccept = [];
        $hourlyReject = [];
        foreach ($raw as $row) {
            $h = (int) $row->hr;
            if ($row->action === 'INSPECTOR_ACCEPT') {
                $hourlyAccept[$h] = (int) $row->count;
            } else {
                $hourlyReject[$h] = (int) $row->count;
            }
        }

        $trend = [];
        for ($h = 0; $h < 24; $h++) {
            $label = sprintf('%02d:00', $h);
            $trend[] = [
                'period' => $label,
                'accepted' => $hourlyAccept[$h] ?? 0,
                'rejected' => $hourlyReject[$h] ?? 0,
            ];
        }

        return [
            'breakdown' => [
                ['name' => 'Accepted', 'count' => $acceptCount, 'color' => '#10b981'],
                ['name' => 'Rejected', 'count' => $rejectCount, 'color' => '#ef4444'],
            ],
            'trend' => $trend,
        ];
    }

    /**
     * Get aggregate dashboard payload for Inspector.
     */
    public function getInspectorDashboardData(User $user, array $filters = []): array
    {
        return [
            'kpis' => $this->getDashboardKPIs(),
            'pendingQueue' => $this->getPendingQueue($filters),
            'recentActivity' => $this->getRecentActivity($user->id),
            'activityChart' => $this->getActivityChart($user->id),
        ];
    }
}
