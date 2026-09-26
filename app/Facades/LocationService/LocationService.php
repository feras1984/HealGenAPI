<?php

namespace App\Facades\LocationService;

use App\Models\Location;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapLocationModel(Location $location)
 * @method static array getLocations()
 * @method static array getLocation(Location $location)
 * @method static Location store(array $data)
 * @method static Location update(array $data, Location $location)
 * @method static Location toggleActive(Location $location)
 * @method static Location|null validateCode(string $code, ?int $ignoreId = null)
 */
class LocationService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'LocationService';
    }
}
