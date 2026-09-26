<?php

namespace App\Facades\EmployeeDashboardService;

use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array getEmployeeDashboardData(User $user, array $filters = [])
 */
class EmployeeDashboardService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'EmployeeDashboardService';
    }
}
