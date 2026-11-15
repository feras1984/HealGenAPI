<?php

namespace App\Services\InspectorService;

use App\Models\Device;
use App\Models\Location;
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
     * Get user role helper.
     */
    public function getUserRole(User $user): string
    {
        $adminRef = $user->reference()->first();
        return strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');
    }

    /**
     * Get KPI summary counts for Inspector dashboard.
     * When user is an Inspector, counts are strictly scoped to their assigned location.
     */
    public function getDashboardKPIs(?User $user = null, ?int $locationId = null): array
    {
        $role = $user ? $this->getUserRole($user) : '';

        // If Inspector has no assigned location, return zeroes
        if ($role === 'inspector' && $locationId === null) {
            return [
                'pendingCount' => 0,
                'acceptedTodayCount' => 0,
                'rejectedTodayCount' => 0,
                'inspectedTodayCount' => 0,
            ];
        }

        $pendingQuery = PatientHeader::query()->whereIn('Status', self::PENDING_STATUSES);

        if ($locationId !== null) {
            $pendingQuery->whereHas('device', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        }

        $pendingCount = $pendingQuery->count();
        $today = Carbon::today();

        $acceptedQuery = PatientTestAction::query()
            ->where('action', 'INSPECTOR_ACCEPT')
            ->whereDate('created_at', $today);

        $rejectedQuery = PatientTestAction::query()
            ->where('action', 'INSPECTOR_REJECT')
            ->whereDate('created_at', $today);

        if ($role === 'inspector') {
            $acceptedQuery->where('user_id', $user->id)
                ->where(function ($q) use ($locationId) {
                    $q->where('location_id', $locationId)
                      ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                          $devQ->where('location_id', $locationId);
                      });
                });

            $rejectedQuery->where('user_id', $user->id)
                ->where(function ($q) use ($locationId) {
                    $q->where('location_id', $locationId)
                      ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                          $devQ->where('location_id', $locationId);
                      });
                });
        } elseif ($locationId !== null) {
            $acceptedQuery->where(function ($q) use ($locationId) {
                $q->where('location_id', $locationId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                      $devQ->where('location_id', $locationId);
                  });
            });

            $rejectedQuery->where(function ($q) use ($locationId) {
                $q->where('location_id', $locationId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                      $devQ->where('location_id', $locationId);
                  });
            });
        }

        $acceptedTodayCount = $acceptedQuery->count();
        $rejectedTodayCount = $rejectedQuery->count();

        return [
            'pendingCount' => $pendingCount,
            'acceptedTodayCount' => $acceptedTodayCount,
            'rejectedTodayCount' => $rejectedTodayCount,
            'inspectedTodayCount' => $acceptedTodayCount + $rejectedTodayCount,
        ];
    }

    /**
     * Get tests in the Pending Inspection Queue.
     * For Inspectors, this is strictly scoped to the assigned Location.
     */
    public function getPendingQueue(array $filters = [], ?User $user = null, ?int $locationId = null, int $limit = 50): array
    {
        $role = $user ? $this->getUserRole($user) : '';

        // If Inspector is unassigned, return empty queue immediately
        if ($role === 'inspector' && $locationId === null) {
            return [];
        }

        $query = PatientHeader::with(['device.location', 'device.deviceType', 'tests'])
            ->whereIn('Status', self::PENDING_STATUSES);

        // Security rule: Inspector is strictly scoped to their assigned Location
        if ($role === 'inspector') {
            $query->whereHas('device', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        } elseif ($locationId !== null) {
            $query->whereHas('device', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        } elseif (!empty($filters['locationId'])) {
            $filterLocId = $filters['locationId'];
            $query->whereHas('device', function ($q) use ($filterLocId) {
                $q->where('location_id', $filterLocId);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('DeviceId', $filters['deviceId']);
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
                  ->orWhere('DeviceCode', 'like', "%{$search}%");
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
     * When locationId is provided, only actions within that location are returned.
     */
    public function getRecentActivity(int $userId, ?int $locationId = null, int $limit = 10): array
    {
        $query = PatientTestAction::with(['patientHeader.device'])
            ->where('user_id', $userId);

        if ($locationId !== null) {
            $query->where(function ($q) use ($locationId) {
                $q->where('location_id', $locationId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                      $devQ->where('location_id', $locationId);
                  });
            });
        }

        $actions = $query->orderBy('id', 'desc')
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
     * Independently verify that the target test originates from a device belonging
     * to the Inspector's currently assigned location.
     * Prevents IDOR and blocks mutations on tests from unauthorized or previously assigned locations.
     */
    public function verifyInspectorTestAuthorization(User $user, PatientHeader $patientHeader): int
    {
        $role = $this->getUserRole($user);
        if (!in_array($role, ['inspector', 'administrator'], true)) {
            throw new \Illuminate\Auth\Access\AuthorizationException("Unauthorized action. Only Inspectors or Administrators can accept or reject tests.");
        }

        $patientHeader->loadMissing('device');
        $device = $patientHeader->device;
        if (!$device || !$device->location_id) {
            throw new \Illuminate\Auth\Access\AuthorizationException("Test #{$patientHeader->Id} is not associated with a valid device or location.");
        }

        $testLocationId = (int) $device->location_id;

        if ($role === 'inspector') {
            $assignedLocationId = $user->getAssignedLocationId();
            if ($assignedLocationId === null) {
                throw new \Illuminate\Auth\Access\AuthorizationException("You are not currently assigned to any location.");
            }

            if ($testLocationId !== (int) $assignedLocationId) {
                throw new \Illuminate\Auth\Access\AuthorizationException(
                    "Unauthorized action. You are only authorized to review tests originating from your currently assigned location."
                );
            }
        }

        return $testLocationId;
    }

    /**
     * Inspector Accept Action with backend status validation & DB transaction.
     */
    public function acceptTest(PatientHeader $patientHeader, User $user): array
    {
        $testLocationId = $this->verifyInspectorTestAuthorization($user, $patientHeader);

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
        }

        return DB::transaction(function () use ($patientHeader, $user, $testLocationId) {
            $patientHeader->refresh();
            $this->verifyInspectorTestAuthorization($user, $patientHeader);

            if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
                throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
            }

            $previousStatus = $patientHeader->Status;
            $newStatus = 'Inspector Accepted';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Inspector';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'location_id' => $testLocationId,
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
                'kpis' => $this->getDashboardKPIs($user, $user->getAssignedLocationId()),
            ];
        });
    }

    /**
     * Inspector Reject Action with mandatory reason validation, status validation & DB transaction.
     */
    public function rejectTest(PatientHeader $patientHeader, User $user, string $reason): array
    {
        $testLocationId = $this->verifyInspectorTestAuthorization($user, $patientHeader);

        $trimmedReason = trim($reason);
        if (empty($trimmedReason)) {
            throw new InvalidArgumentException("A rejection reason is required.");
        }

        if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
            throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
        }

        return DB::transaction(function () use ($patientHeader, $user, $trimmedReason, $testLocationId) {
            $patientHeader->refresh();
            $this->verifyInspectorTestAuthorization($user, $patientHeader);

            if (!in_array($patientHeader->Status, self::PENDING_STATUSES, true)) {
                throw new InvalidArgumentException("Test #{$patientHeader->Id} is no longer pending inspection. Current status: {$patientHeader->Status}");
            }

            $previousStatus = $patientHeader->Status;
            $newStatus = 'Inspector Rejected';

            $patientHeader->Status = $newStatus;
            $patientHeader->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Inspector';

            PatientTestAction::create([
                'patient_header_id' => $patientHeader->Id,
                'location_id' => $testLocationId,
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
                'kpis' => $this->getDashboardKPIs($user, $user->getAssignedLocationId()),
            ];
        });
    }

    /**
     * Get Inspector activity chart data (breakdown and trend).
     */
    public function getActivityChart(int $userId, ?int $locationId = null): array
    {
        $today = Carbon::today();

        $baseQuery = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereDate('created_at', $today);

        if ($locationId !== null) {
            $baseQuery->where(function ($q) use ($locationId) {
                $q->where('location_id', $locationId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locationId) {
                      $devQ->where('location_id', $locationId);
                  });
            });
        }

        $acceptCount = (clone $baseQuery)->where('action', 'INSPECTOR_ACCEPT')->count();
        $rejectCount = (clone $baseQuery)->where('action', 'INSPECTOR_REJECT')->count();

        // Hourly actions today (cross-database compatible)
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $hourExpr = $isSqlite ? "strftime('%H', created_at)" : 'DATEPART(hour, created_at)';

        $raw = (clone $baseQuery)
            ->whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])
            ->select(
                'action',
                DB::raw("{$hourExpr} as hr"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('action', DB::raw($hourExpr))
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
        $role = $this->getUserRole($user);

        $locationId = null;
        if ($role === 'inspector') {
            $locationId = $user->getAssignedLocationId();
            if ($locationId === null) {
                // Inspector is currently unassigned - return zeroed payload with no test leaks
                return [
                    'assignedLocation' => null,
                    'kpis' => [
                        'pendingCount' => 0,
                        'acceptedTodayCount' => 0,
                        'rejectedTodayCount' => 0,
                        'inspectedTodayCount' => 0,
                    ],
                    'pendingQueue' => [],
                    'recentActivity' => [],
                    'activityChart' => [
                        'breakdown' => [
                            ['name' => 'Accepted', 'count' => 0, 'color' => '#10b981'],
                            ['name' => 'Rejected', 'count' => 0, 'color' => '#ef4444'],
                        ],
                        'trend' => array_map(function ($h) {
                            return ['period' => sprintf('%02d:00', $h), 'accepted' => 0, 'rejected' => 0];
                        }, range(0, 23)),
                    ],
                ];
            }
        } elseif (!empty($filters['locationId'])) {
            $locationId = (int) $filters['locationId'];
        }

        $assignedLocation = $locationId ? Location::find($locationId) : null;

        return [
            'userRole' => $role,
            'assignedLocation' => $assignedLocation ? [
                'id' => $assignedLocation->id,
                'name' => $assignedLocation->name,
                'code' => $assignedLocation->code,
            ] : null,
            'kpis' => $this->getDashboardKPIs($user, $locationId),
            'pendingQueue' => $this->getPendingQueue($filters, $user, $locationId),
            'recentActivity' => $this->getRecentActivity($user->id, $locationId),
            'activityChart' => $this->getActivityChart($user->id, $locationId),
        ];
    }
}

