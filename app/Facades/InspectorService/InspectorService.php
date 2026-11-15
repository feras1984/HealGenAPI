<?php

namespace App\Facades\InspectorService;

use App\Models\PatientHeader;
use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static string getUserRole(User $user)
 * @method static void checkInspectorAuthorization(User $user)
 * @method static int verifyInspectorTestAuthorization(User $user, PatientHeader $patientHeader)
 * @method static array getDashboardKPIs(?User $user = null, ?int $locationId = null)
 * @method static array getPendingQueue(array $filters = [], ?User $user = null, ?int $locationId = null, int $limit = 50)
 * @method static array getRecentActivity(int $userId, ?int $locationId = null, int $limit = 10)
 * @method static array acceptTest(PatientHeader $patientHeader, User $user)
 * @method static array rejectTest(PatientHeader $patientHeader, User $user, string $reason)
 * @method static array getActivityChart(int $userId, ?int $locationId = null)
 * @method static array getInspectorDashboardData(User $user, array $filters = [])
 */
class InspectorService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'InspectorService';
    }
}
