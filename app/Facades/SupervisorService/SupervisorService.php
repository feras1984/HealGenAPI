<?php

namespace App\Facades\SupervisorService;

use App\Models\PatientHeader;
use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array getDashboardKPIs()
 * @method static array getPendingQueue(array $filters = [], int $limit = 50)
 * @method static array getRecentActivity(int $userId, int $limit = 10)
 * @method static array confirmTest(PatientHeader $patientHeader, User $user, ?string $note = null)
 * @method static array rejectTest(PatientHeader $patientHeader, User $user, string $reason)
 * @method static array getSupervisorDashboardData(User $user, array $filters = [])
 */
class SupervisorService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'SupervisorService';
    }
}
