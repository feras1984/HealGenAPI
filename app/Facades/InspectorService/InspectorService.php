<?php

namespace App\Facades\InspectorService;

use App\Models\PatientHeader;
use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array getDashboardKPIs()
 * @method static array getPendingQueue(array $filters = [], int $limit = 50)
 * @method static array getRecentActivity(int $userId, int $limit = 10)
 * @method static array acceptTest(PatientHeader $patientHeader, User $user)
 * @method static array rejectTest(PatientHeader $patientHeader, User $user, string $reason)
 * @method static array getInspectorDashboardData(User $user, array $filters = [])
 */
class InspectorService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'InspectorService';
    }
}
