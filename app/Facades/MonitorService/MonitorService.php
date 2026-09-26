<?php

namespace App\Facades\MonitorService;

use Illuminate\Support\Facades\Facade;

/**
 * @method static array getSummary(array $filters = [])
 * @method static array getTestOperations(array $filters = [], int $limit = 25)
 * @method static array getDeviceOperations(array $filters = [])
 * @method static array getRoleOperations()
 * @method static array getMonitorData(array $filters = [])
 */
class MonitorService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'MonitorService';
    }
}
