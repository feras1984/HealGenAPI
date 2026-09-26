<?php

namespace App\Facades\DeviceService;

use App\Models\Device;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapDeviceModel(Device $device)
 * @method static array getDevices()
 * @method static array getDevice(Device $device)
 * @method static Device store(array $data)
 * @method static Device update(array $data, Device $device)
 * @method static Device toggleActive(Device $device)
 * @method static Device|null validateCode(string $deviceCode, ?int $ignoreId = null)
 */
class DeviceService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'DeviceService';
    }
}
