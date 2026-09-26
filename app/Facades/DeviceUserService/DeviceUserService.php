<?php

namespace App\Facades\DeviceUserService;

use App\Models\DeviceUser;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapDeviceUserModel(DeviceUser $deviceUser)
 * @method static array getAssignments()
 * @method static DeviceUser assign(array $data)
 * @method static DeviceUser unassign(DeviceUser $deviceUser)
 * @method static DeviceUser reassign(DeviceUser $deviceUser)
 */
class DeviceUserService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'DeviceUserService';
    }
}
