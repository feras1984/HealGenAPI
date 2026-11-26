<?php

namespace App\Services\SupervisorService;

use App\Models\PatientHeader;
use App\Models\PatientTestAction;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use App\Jobs\SendPatientToHISJob;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SupervisorService
{
    /**
     * Statuses eligible for Expert confirmation or rejection.
     * Includes direct Employee-submitted tests (Imported, Awaiting Inspection)
     * as well as Inspector-forwarded and legacy pending tests.
     */
    public const PENDING_STATUSES = [
        'Imported',
        'Awaiting Inspection',
        'Inspector Accepted',
        'Awaiting Supervisor',
    ];

    /**
     * Employee-submitted statuses that have not undergone Inspector processing.
     */
    public const DIRECT_PENDING_STATUSES = [
        'Imported',
        'Awaiting Inspection',
    ];

    /**
     * Statuses forwarded by an Inspector or legacy supervisor queue.
     */
    public const INSPECTOR_FORWARDED_STATUSES = [
        'Inspector Accepted',
        'Awaiting Supervisor',
    ];

    /**
     * Post-confirm statuses (including tests already dispatched to HIS).
     */
    public const CONFIRMED_RESULT_STATUSES = [
        'Confirmed',
        'SentToHIS',
        'FailedToSend',
    ];

    /**
     * Final Expert rejection status(es).
     */
    public const REJECTED_STATUSES = [
        'Supervisor Rejected',
    ];

    public const ACTION_REVIEW = 'EXPERT_REVIEW';
    public const ACTION_CONFIRM = 'EXPERT_CONFIRM';
    public const ACTION_REJECT = 'EXPERT_REJECT';

    /**
     * Action codes representing Expert/Supervisor confirmation (including legacy records).
     */
    public const CONFIRM_ACTIONS = [
        'EXPERT_CONFIRM',
        'SUPERVISOR_CONFIRM',
    ];

    /**
     * Action codes representing Expert/Supervisor rejection (including legacy records).
     */
    public const REJECT_ACTIONS = [
        'EXPERT_REJECT',
        'SUPERVISOR_REJECT',
    ];

    /**
     * Action codes representing final Expert/Supervisor decisions.
     */
    public const DECISION_ACTIONS = [
        'EXPERT_CONFIRM',
        'EXPERT_REJECT',
        'SUPERVISOR_CONFIRM',
        'SUPERVISOR_REJECT',
    ];

    private function applyHeaderFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
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
    }

    private function applyConfirmedScope(Builder $query): void
    {
        $query->where(function ($q) {
            $q->where('Status', 'Confirmed')
              ->orWhere(function ($sub) {
                  $sub->whereIn('Status', ['SentToHIS', 'FailedToSend'])
                      ->whereHas('actions', function ($actQ) {
                          $actQ->whereIn('action', self::CONFIRM_ACTIONS);
                      });
              });
        });
    }

    private function normalizeView(?string $view): string
    {
        $normalized = strtolower(trim((string) $view));
        if (in_array($normalized, ['pending', 'confirmed', 'rejected', 'all'], true)) {
            return $normalized;
        }

        return 'pending';
    }

    /**
     * Get KPI summary counts for Expert dashboard.
     */
    public function getDashboardKPIs(array $filters = []): array
    {
        $baseHeaderFilters = array_intersect_key($filters, array_flip(['locationId', 'deviceId', 'date']));

        $pendingQuery = PatientHeader::query()->whereIn('Status', self::PENDING_STATUSES);
        $this->applyHeaderFilters($pendingQuery, $baseHeaderFilters);
        $pendingCount = $pendingQuery->count();

        $directPendingQuery = PatientHeader::query()->whereIn('Status', self::DIRECT_PENDING_STATUSES);
        $this->applyHeaderFilters($directPendingQuery, $baseHeaderFilters);
        $directPendingCount = $directPendingQuery->count();

        $inspectorForwardedPendingQuery = PatientHeader::query()->whereIn('Status', self::INSPECTOR_FORWARDED_STATUSES);
        $this->applyHeaderFilters($inspectorForwardedPendingQuery, $baseHeaderFilters);
        $inspectorForwardedPendingCount = $inspectorForwardedPendingQuery->count();

        $totalConfirmedQuery = PatientHeader::query();
        $this->applyConfirmedScope($totalConfirmedQuery);
        $this->applyHeaderFilters($totalConfirmedQuery, $baseHeaderFilters);
        $totalConfirmedCount = $totalConfirmedQuery->count();

        $totalRejectedQuery = PatientHeader::query()->whereIn('Status', self::REJECTED_STATUSES);
        $this->applyHeaderFilters($totalRejectedQuery, $baseHeaderFilters);
        $totalRejectedCount = $totalRejectedQuery->count();

        $today = Carbon::today();

        $confirmedTodayQuery = PatientTestAction::query()
            ->whereIn('action', self::CONFIRM_ACTIONS)
            ->whereDate('created_at', $today);

        $rejectedTodayQuery = PatientTestAction::query()
            ->whereIn('action', self::REJECT_ACTIONS)
            ->whereDate('created_at', $today);

        if (!empty($filters['locationId'])) {
            $locId = (int) $filters['locationId'];
            $confirmedTodayQuery->where(function ($q) use ($locId) {
                $q->where('location_id', $locId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locId) {
                      $devQ->where('location_id', $locId);
                  });
            });
            $rejectedTodayQuery->where(function ($q) use ($locId) {
                $q->where('location_id', $locId)
                  ->orWhereHas('patientHeader.device', function ($devQ) use ($locId) {
                      $devQ->where('location_id', $locId);
                  });
            });
        }

        if (!empty($filters['deviceId'])) {
            $devId = (int) $filters['deviceId'];
            $confirmedTodayQuery->whereHas('patientHeader', fn ($q) => $q->where('DeviceId', $devId));
            $rejectedTodayQuery->whereHas('patientHeader', fn ($q) => $q->where('DeviceId', $devId));
        }

        $confirmedTodayCount = $confirmedTodayQuery->count();
        $rejectedTodayCount = $rejectedTodayQuery->count();

        return [
            'pendingCount' => $pendingCount,
            'directPendingCount' => $directPendingCount,
            'inspectorForwardedPendingCount' => $inspectorForwardedPendingCount,
            'confirmedTodayCount' => $confirmedTodayCount,
            'rejectedTodayCount' => $rejectedTodayCount,
            'processedTodayCount' => $confirmedTodayCount + $rejectedTodayCount,
            'totalConfirmedCount' => $totalConfirmedCount,
            'totalRejectedCount' => $totalRejectedCount,
        ];
    }

    /**
     * Get tests for Expert dashboard filtered by view (pending | confirmed | rejected | all)
     * and optional source (all | direct | inspected) when viewing pending tests.
     */
    public function getTestsByView(array $filters = [], int $limit = 50): array
    {
        $view = $this->normalizeView($filters['view'] ?? 'pending');
        $source = strtolower(trim((string) ($filters['source'] ?? 'all')));

        $query = PatientHeader::with([
            'device.location',
            'device.deviceType',
            'tests',
            'latestInspectorAction.user.reference',
            'latestSupervisorAction.user.reference',
            'actions.user.reference',
            'file',
        ]);

        if ($view === 'pending') {
            if ($source === 'direct') {
                $query->whereIn('Status', self::DIRECT_PENDING_STATUSES);
            } elseif ($source === 'inspected') {
                $query->whereIn('Status', self::INSPECTOR_FORWARDED_STATUSES);
            } else {
                $query->whereIn('Status', self::PENDING_STATUSES);
            }
        } elseif ($view === 'confirmed') {
            $this->applyConfirmedScope($query);
        } elseif ($view === 'rejected') {
            $query->whereIn('Status', self::REJECTED_STATUSES);
        } else {
            // 'all' Expert-relevant states: pending + confirmed + rejected
            $query->where(function ($q) {
                $q->whereIn('Status', self::PENDING_STATUSES)
                  ->orWhereIn('Status', self::REJECTED_STATUSES)
                  ->orWhere(function ($confQ) {
                      $this->applyConfirmedScope($confQ);
                  });
            });
        }

        $this->applyHeaderFilters($query, $filters);

        $orderDirection = $view === 'pending' ? 'asc' : 'desc';
        $patients = $query->orderBy('Id', $orderDirection)->limit($limit)->get();

        $list = [];
        foreach ($patients as $patient) {
            $list[] = PatientHeaderService::mapPatientModel($patient);
        }

        return $list;
    }

    /**
     * Get tests in the Pending Expert Review Queue (backward-compatible helper).
     */
    public function getPendingQueue(array $filters = [], int $limit = 50): array
    {
        $filters['view'] = 'pending';

        return $this->getTestsByView($filters, $limit);
    }

    /**
     * Get recent Expert actions logged by the specified user.
     */
    public function getRecentActivity(int $userId, int $limit = 10): array
    {
        $actions = PatientTestAction::with('patientHeader')
            ->where('user_id', $userId)
            ->whereIn('action', self::DECISION_ACTIONS)
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
                'isDirect' => in_array($act->previous_status, self::DIRECT_PENDING_STATUSES, true),
                'createdAt' => Carbon::make($act->created_at)->format('M d, Y H:i:s'),
            ];
        }

        return $list;
    }

    /**
     * Check if user has Expert or Administrator authorization.
     */
    public function checkSupervisorAuthorization(User $user): void
    {
        $adminRef = $user->reference()->first();
        $role = strtolower(trim($adminRef && isset($adminRef->role) ? $adminRef->role : ''));
        if (!in_array($role, ['expert', 'administrator'], true)) {
            throw new \Illuminate\Auth\Access\AuthorizationException("Unauthorized action. Only Experts or Administrators can confirm or reject tests.");
        }
    }

    /**
     * Record an auditable Expert review event (deduplicated per user per test).
     * Never alters test status or creates Inspector actions.
     */
    public function recordReview(PatientHeader $patientHeader, User $user): array
    {
        $this->checkSupervisorAuthorization($user);

        $recorded = DB::transaction(function () use ($patientHeader, $user) {
            $locked = PatientHeader::with('device')
                ->where('Id', $patientHeader->Id)
                ->lockForUpdate()
                ->firstOrFail();

            $alreadyRecorded = PatientTestAction::query()
                ->where('patient_header_id', $locked->Id)
                ->where('user_id', $user->id)
                ->where('action', self::ACTION_REVIEW)
                ->exists();

            if (!$alreadyRecorded) {
                $adminRef = $user->reference()->first();
                $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Expert';
                $testLocationId = $locked->device?->location_id;

                PatientTestAction::create([
                    'patient_header_id' => $locked->Id,
                    'location_id' => $testLocationId,
                    'user_id' => $user->id,
                    'role' => $roleName,
                    'action' => self::ACTION_REVIEW,
                    'previous_status' => $locked->Status,
                    'new_status' => $locked->Status,
                    'reason' => null,
                ]);

                \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                    $user,
                    self::ACTION_REVIEW,
                    'PatientHeader',
                    (string) $locked->Id,
                    "Opened test #{$locked->Id} for expert review (Status: {$locked->Status})."
                );
            }

            $locked->load([
                'device.location',
                'device.deviceType',
                'tests',
                'file',
                'latestInspectorAction.user.reference',
                'latestSupervisorAction.user.reference',
                'actions.user.reference',
            ]);

            return [
                'recorded' => !$alreadyRecorded,
                'test' => PatientHeaderService::mapPatientModel($locked),
            ];
        });

        return $recorded;
    }

    /**
     * Expert Confirm Action with backend status validation, pessimistic row locking,
     * DB transaction, distinct Expert audit trail, and post-commit HIS dispatch.
     */
    public function confirmTest(PatientHeader $patientHeader, User $user, ?string $note = null): array
    {
        $this->checkSupervisorAuthorization($user);

        $trimmedNote = $note !== null && trim($note) !== '' ? trim($note) : null;

        $result = DB::transaction(function () use ($patientHeader, $user, $trimmedNote) {
            $locked = PatientHeader::with('device')
                ->where('Id', $patientHeader->Id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!in_array($locked->Status, self::PENDING_STATUSES, true)) {
                throw new InvalidArgumentException("Test #{$locked->Id} is no longer pending expert review. Current status: {$locked->Status}");
            }

            $previousStatus = $locked->Status;
            $newStatus = 'Confirmed';
            $isDirect = in_array($previousStatus, self::DIRECT_PENDING_STATUSES, true);

            $locked->Status = $newStatus;
            $locked->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Expert';

            $testLocationId = $locked->device?->location_id;

            PatientTestAction::create([
                'patient_header_id' => $locked->Id,
                'location_id' => $testLocationId,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => self::ACTION_CONFIRM,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => $trimmedNote,
            ]);

            $pathLabel = $isDirect ? 'Direct expert confirmation (without inspector)' : 'Expert confirmation';
            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                self::ACTION_CONFIRM,
                'PatientHeader',
                (string) $locked->Id,
                "{$pathLabel} on test #{$locked->Id} & dispatched to HIS. Status changed from {$previousStatus} to {$newStatus}."
            );

            $locked->load([
                'device.location',
                'device.deviceType',
                'tests',
                'file',
                'latestInspectorAction.user.reference',
                'latestSupervisorAction.user.reference',
                'actions.user.reference',
            ]);

            return [
                'test' => PatientHeaderService::mapPatientModel($locked),
                'kpis' => $this->getDashboardKPIs(),
            ];
        });

        // Dispatch background job strictly after transaction commit
        try {
            SendPatientToHISJob::dispatch($patientHeader->Id);
        } catch (\Throwable $e) {
            logger()->error("Failed to dispatch SendPatientToHISJob for test #{$patientHeader->Id}: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Expert Bulk Confirm Action with per-test atomic locked transactions,
     * partial-success reporting, and post-commit HIS dispatch.
     */
    public function bulkConfirmTests(array $ids, User $user, ?string $note = null): array
    {
        $this->checkSupervisorAuthorization($user);

        $uniqueIds = array_values(array_unique(array_map('intval', $ids)));
        $trimmedNote = $note !== null && trim($note) !== '' ? trim($note) : null;

        $adminRef = $user->reference()->first();
        $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Expert';

        $existingIds = PatientHeader::query()
            ->whereIn('Id', $uniqueIds)
            ->pluck('Id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $existingMap = array_flip($existingIds);

        $confirmedIds = [];
        $skipped = [];

        foreach ($uniqueIds as $id) {
            if (!isset($existingMap[$id])) {
                $skipped[] = [
                    'id' => $id,
                    'reason' => "Test #{$id} was not found.",
                    'code' => 'not_found',
                ];
                continue;
            }

            try {
                $outcome = DB::transaction(function () use ($id, $user, $roleName, $trimmedNote) {
                    $locked = PatientHeader::with('device')
                        ->where('Id', $id)
                        ->lockForUpdate()
                        ->first();

                    if (!$locked) {
                        return [
                            'confirmed' => false,
                            'code' => 'not_found',
                            'reason' => "Test #{$id} was not found.",
                        ];
                    }

                    if (!in_array($locked->Status, self::PENDING_STATUSES, true)) {
                        return [
                            'confirmed' => false,
                            'code' => 'invalid_status',
                            'reason' => "Test #{$locked->Id} is no longer pending expert review (Current status: {$locked->Status}).",
                        ];
                    }

                    $previousStatus = $locked->Status;
                    $newStatus = 'Confirmed';
                    $isDirect = in_array($previousStatus, self::DIRECT_PENDING_STATUSES, true);

                    $locked->Status = $newStatus;
                    $locked->save();

                    $testLocationId = $locked->device?->location_id;

                    PatientTestAction::create([
                        'patient_header_id' => $locked->Id,
                        'location_id' => $testLocationId,
                        'user_id' => $user->id,
                        'role' => $roleName,
                        'action' => self::ACTION_CONFIRM,
                        'previous_status' => $previousStatus,
                        'new_status' => $newStatus,
                        'reason' => $trimmedNote,
                    ]);

                    $pathLabel = $isDirect ? 'Direct bulk expert confirmation' : 'Bulk expert confirmation';
                    \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                        $user,
                        self::ACTION_CONFIRM,
                        'PatientHeader',
                        (string) $locked->Id,
                        "{$pathLabel} on test #{$locked->Id} & dispatched to HIS. Status changed from {$previousStatus} to {$newStatus}."
                    );

                    return ['confirmed' => true];
                });

                if ($outcome['confirmed']) {
                    $confirmedIds[] = $id;

                    try {
                        SendPatientToHISJob::dispatch($id);
                    } catch (\Throwable $e) {
                        logger()->error("Failed to dispatch SendPatientToHISJob for bulk-confirmed test #{$id}: " . $e->getMessage());
                    }
                } else {
                    $skipped[] = [
                        'id' => $id,
                        'reason' => $outcome['reason'],
                        'code' => $outcome['code'],
                    ];
                }
            } catch (\Throwable $e) {
                logger()->error("Error bulk confirming test #{$id}: " . $e->getMessage());
                $skipped[] = [
                    'id' => $id,
                    'reason' => "Unexpected error confirming test #{$id}.",
                    'code' => 'error',
                ];
            }
        }

        return [
            'confirmedIds' => $confirmedIds,
            'confirmedCount' => count($confirmedIds),
            'skipped' => $skipped,
            'skippedCount' => count($skipped),
            'kpis' => $this->getDashboardKPIs(),
        ];
    }

    /**
     * Expert Reject Action with mandatory reason validation, pessimistic row locking,
     * status validation, and distinct Expert audit trail.
     */
    public function rejectTest(PatientHeader $patientHeader, User $user, string $reason): array
    {
        $this->checkSupervisorAuthorization($user);

        $trimmedReason = trim($reason);
        if (mb_strlen($trimmedReason) < 3) {
            throw new InvalidArgumentException("A rejection reason of at least 3 characters is required.");
        }

        return DB::transaction(function () use ($patientHeader, $user, $trimmedReason) {
            $locked = PatientHeader::with('device')
                ->where('Id', $patientHeader->Id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!in_array($locked->Status, self::PENDING_STATUSES, true)) {
                throw new InvalidArgumentException("Test #{$locked->Id} is no longer pending expert review. Current status: {$locked->Status}");
            }

            $previousStatus = $locked->Status;
            $newStatus = 'Supervisor Rejected';
            $isDirect = in_array($previousStatus, self::DIRECT_PENDING_STATUSES, true);

            $locked->Status = $newStatus;
            $locked->save();

            $adminRef = $user->reference()->first();
            $roleName = $adminRef && isset($adminRef->role) ? $adminRef->role : 'Expert';

            $testLocationId = $locked->device?->location_id;

            PatientTestAction::create([
                'patient_header_id' => $locked->Id,
                'location_id' => $testLocationId,
                'user_id' => $user->id,
                'role' => $roleName,
                'action' => self::ACTION_REJECT,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'reason' => $trimmedReason,
            ]);

            $pathLabel = $isDirect ? 'Direct expert rejection (without inspector)' : 'Expert rejection';
            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                self::ACTION_REJECT,
                'PatientHeader',
                (string) $locked->Id,
                "{$pathLabel} on test #{$locked->Id}. Status changed from {$previousStatus} to {$newStatus}. Reason: {$trimmedReason}."
            );

            $locked->load([
                'device.location',
                'device.deviceType',
                'tests',
                'file',
                'latestInspectorAction.user.reference',
                'latestSupervisorAction.user.reference',
                'actions.user.reference',
            ]);

            return [
                'test' => PatientHeaderService::mapPatientModel($locked),
                'kpis' => $this->getDashboardKPIs(),
            ];
        });
    }

    /**
     * Get Expert activity chart data (breakdown and trend) across new and legacy Expert actions.
     */
    public function getActivityChart(int $userId): array
    {
        $today = Carbon::today();

        $confirmCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereIn('action', self::CONFIRM_ACTIONS)
            ->whereDate('created_at', $today)
            ->count();

        $rejectCount = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereIn('action', self::REJECT_ACTIONS)
            ->whereDate('created_at', $today)
            ->count();

        // Hourly actions today (cross-database compatible)
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $hourExpr = $isSqlite ? "strftime('%H', created_at)" : 'DATEPART(hour, created_at)';

        $raw = PatientTestAction::query()
            ->where('user_id', $userId)
            ->whereIn('action', self::DECISION_ACTIONS)
            ->whereDate('created_at', $today)
            ->select(
                'action',
                DB::raw("{$hourExpr} as hr"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('action', DB::raw($hourExpr))
            ->get();

        $hourlyConfirm = [];
        $hourlyReject = [];
        foreach ($raw as $row) {
            $h = (int) $row->hr;
            if (in_array($row->action, self::CONFIRM_ACTIONS, true)) {
                $hourlyConfirm[$h] = ($hourlyConfirm[$h] ?? 0) + (int) $row->count;
            } else {
                $hourlyReject[$h] = ($hourlyReject[$h] ?? 0) + (int) $row->count;
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
     * Get aggregate dashboard payload for Expert.
     */
    public function getSupervisorDashboardData(User $user, array $filters = []): array
    {
        $activeView = $this->normalizeView($filters['view'] ?? 'pending');
        $tests = $this->getTestsByView($filters);

        return [
            'activeView' => $activeView,
            'kpis' => $this->getDashboardKPIs($filters),
            'pendingQueue' => $tests,
            'tests' => $tests,
            'recentActivity' => $this->getRecentActivity($user->id),
            'activityChart' => $this->getActivityChart($user->id),
        ];
    }
}
