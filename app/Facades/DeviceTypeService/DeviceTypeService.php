<?php

namespace App\Facades\DeviceTypeService;

use App\Models\DeviceType;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapDeviceTypeModel(DeviceType $deviceType)
 * @method static array getDeviceTypes()
 * @method static array getDeviceType(DeviceType $deviceType)
 * @method static DeviceType store(array $data)
 * @method static DeviceType update(array $data, DeviceType $deviceType)
 * @method static DeviceType toggleActive(DeviceType $deviceType)
 */
class DeviceTypeService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'DeviceTypeService';
    }
}
