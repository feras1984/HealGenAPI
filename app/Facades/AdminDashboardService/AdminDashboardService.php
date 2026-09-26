<?php

namespace App\Facades\AdminDashboardService;

use Illuminate\Support\Facades\Facade;

/**
 * @method static array getAdminDashboardData(array $filters = [])
 */
class AdminDashboardService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'AdminDashboardService';
    }
}
