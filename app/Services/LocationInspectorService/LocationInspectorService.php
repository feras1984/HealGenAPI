<?php

namespace App\Services\LocationInspectorService;

use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\User;
use App\Services\SystemAuditLogService\SystemAuditLogService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LocationInspectorService
{
    protected ?SystemAuditLogService $auditLogService;

    public function __construct(?SystemAuditLogService $auditLogService = null)
    {
        $this->auditLogService = $auditLogService;
    }

    protected function getAuditLogService(): SystemAuditLogService
    {
        if (!$this->auditLogService) {
            $this->auditLogService = app('SystemAuditLogService');
        }
        return $this->auditLogService;
    }

    /**
     * Map a LocationInspector model to array.
     */
    public function mapAssignmentModel(LocationInspector $assignment): array
    {
        $user = $assignment->user;
        $location = $assignment->location;
        $userName = $user ? $user->email : "User #{$assignment->user_id}";
        if ($user && $user->reference) {
            $ref = $user->reference;
            $name = trim(($ref->first_name ?? '') . ' ' . ($ref->last_name ?? ''));
            if (!empty($name)) {
                $userName = $name;
            }
        }

        return [
            'id' => $assignment->id,
            'locationId' => $assignment->location_id,
            'locationName' => $location?->name ?? "Location #{$assignment->location_id}",
            'locationCode' => $location?->code ?? '',
            'userId' => $assignment->user_id,
            'userName' => $userName,
            'userEmail' => $user?->email ?? '',
            'assignedAt' => $assignment->assigned_at ? Carbon::make($assignment->assigned_at)->format('M d, Y H:i:s') : '',
            'unassignedAt' => $assignment->unassigned_at ? Carbon::make($assignment->unassigned_at)->format('M d, Y H:i:s') : null,
            'isActive' => (bool) $assignment->is_active,
            'createdAt' => $assignment->created_at ? Carbon::make($assignment->created_at)->format('M d, Y') : '',
        ];
    }

    /**
     * Get list of inspector assignments.
     */
    public function getAssignments(array $filters = []): array
    {
        $query = LocationInspector::query()->with(['user.reference', 'location']);

        if (isset($filters['isActive'])) {
            $query->where('is_active', filter_var($filters['isActive'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['locationId'])) {
            $query->where('location_id', $filters['locationId']);
        }

        if (!empty($filters['userId'])) {
            $query->where('user_id', $filters['userId']);
        }

        $assignments = $query->orderBy('id', 'desc')->get();
        $list = [];
        foreach ($assignments as $assignment) {
            $list[] = $this->mapAssignmentModel($assignment);
        }

        return $list;
    }

    /**
     * Assign an Inspector to a Location.
     * Enforces:
     * - 1 active inspector per location (deactivates previous active inspector for this location)
     * - 1 active location per inspector (deactivates previous active location for this inspector)
     * - Executed atomically within a DB transaction.
     */
    public function assign(int $locationId, int $userId, ?User $actor = null): LocationInspector
    {
        $location = Location::find($locationId);
        if (!$location) {
            throw new InvalidArgumentException("Location with ID {$locationId} does not exist.");
        }

        $inspector = User::find($userId);
        if (!$inspector) {
            throw new InvalidArgumentException("User with ID {$userId} does not exist.");
        }

        return DB::transaction(function () use ($location, $inspector, $actor) {
            $now = Carbon::now();

            // 1. Deactivate any existing active assignment for this location
            $previousLocationAssignments = LocationInspector::where('location_id', $location->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            foreach ($previousLocationAssignments as $prev) {
                if ($prev->user_id !== $inspector->id) {
                    $prev->update([
                        'is_active' => false,
                        'unassigned_at' => $now,
                    ]);

                    $this->getAuditLogService()->logAction(
                        $actor,
                        'INSPECTOR_UNASSIGNED_BY_REPLACEMENT',
                        'LocationInspector',
                        (string) $prev->id,
                        [
                            'location_id' => $location->id,
                            'unassigned_user_id' => $prev->user_id,
                            'replaced_by_user_id' => $inspector->id,
                        ]
                    );
                }
            }

            // 2. Deactivate any existing active assignment for this inspector (at other locations)
            $previousUserAssignments = LocationInspector::where('user_id', $inspector->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $transferredFromLocationId = null;
            foreach ($previousUserAssignments as $prev) {
                if ($prev->location_id !== $location->id) {
                    $transferredFromLocationId = $prev->location_id;
                    $prev->update([
                        'is_active' => false,
                        'unassigned_at' => $now,
                    ]);

                    $this->getAuditLogService()->logAction(
                        $actor,
                        'INSPECTOR_TRANSFERRED_OUT',
                        'LocationInspector',
                        (string) $prev->id,
                        [
                            'previous_location_id' => $prev->location_id,
                            'new_location_id' => $location->id,
                            'user_id' => $inspector->id,
                        ]
                    );
                }
            }

            // 3. If the inspector already has an active assignment to this EXACT location, return it
            $existingCurrent = LocationInspector::where('location_id', $location->id)
                ->where('user_id', $inspector->id)
                ->where('is_active', true)
                ->first();

            if ($existingCurrent) {
                return $existingCurrent;
            }

            // 4. Create new active assignment
            $assignment = LocationInspector::create([
                'location_id' => $location->id,
                'user_id' => $inspector->id,
                'assigned_at' => $now,
                'unassigned_at' => null,
                'is_active' => true,
            ]);

            $action = $transferredFromLocationId ? 'INSPECTOR_TRANSFERRED' : 'INSPECTOR_ASSIGNED';
            $this->getAuditLogService()->logAction(
                $actor,
                $action,
                'LocationInspector',
                (string) $assignment->id,
                [
                    'location_id' => $location->id,
                    'user_id' => $inspector->id,
                    'transferred_from_location_id' => $transferredFromLocationId,
                ]
            );

            return $assignment;
        });
    }

    /**
     * Transfer an Inspector to a new Location.
     */
    public function transfer(int $userId, int $newLocationId, ?User $actor = null): LocationInspector
    {
        return $this->assign($newLocationId, $userId, $actor);
    }

    /**
     * Unassign an Inspector by assignment ID or active assignment for Location.
     */
    public function unassign(int $assignmentId, ?User $actor = null): bool
    {
        return DB::transaction(function () use ($assignmentId, $actor) {
            $assignment = LocationInspector::find($assignmentId);
            if (!$assignment || !$assignment->is_active) {
                return false;
            }

            $assignment->update([
                'is_active' => false,
                'unassigned_at' => Carbon::now(),
            ]);

            $this->getAuditLogService()->logAction(
                $actor,
                'INSPECTOR_UNASSIGNED',
                'LocationInspector',
                (string) $assignment->id,
                [
                    'location_id' => $assignment->location_id,
                    'user_id' => $assignment->user_id,
                ]
            );

            return true;
        });
    }

    /**
     * Unassign active inspector from a specific location.
     */
    public function unassignLocation(int $locationId, ?User $actor = null): bool
    {
        $activeAssignment = LocationInspector::where('location_id', $locationId)
            ->where('is_active', true)
            ->first();

        if ($activeAssignment) {
            return $this->unassign($activeAssignment->id, $actor);
        }

        return false;
    }

    /**
     * Get active inspector for a location.
     */
    public function getActiveInspectorForLocation(int $locationId): ?User
    {
        $assignment = LocationInspector::where('location_id', $locationId)
            ->where('is_active', true)
            ->with('user.reference')
            ->first();

        return $assignment?->user;
    }

    /**
     * Get active location for an inspector.
     */
    public function getActiveLocationForInspector(int $userId): ?Location
    {
        $assignment = LocationInspector::where('user_id', $userId)
            ->where('is_active', true)
            ->with('location')
            ->first();

        return $assignment?->location;
    }

    /**
     * Get active assignment for an inspector.
     */
    public function getActiveAssignmentForInspector(int $userId): ?LocationInspector
    {
        return LocationInspector::where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }
}
