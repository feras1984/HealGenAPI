<?php

namespace App\Facades\LocationInspectorService;

use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapAssignmentModel(LocationInspector $assignment)
 * @method static array getAssignments(array $filters = [])
 * @method static LocationInspector assign(int $locationId, int $userId, ?User $actor = null)
 * @method static LocationInspector transfer(int $userId, int $newLocationId, ?User $actor = null)
 * @method static bool unassign(int $assignmentId, ?User $actor = null)
 * @method static bool unassignLocation(int $locationId, ?User $actor = null)
 * @method static User|null getActiveInspectorForLocation(int $locationId)
 * @method static Location|null getActiveLocationForInspector(int $userId)
 * @method static LocationInspector|null getActiveAssignmentForInspector(int $userId)
 */
class LocationInspectorService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'LocationInspectorService';
    }
}
