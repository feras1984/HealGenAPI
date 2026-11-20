<?php

namespace App\Strategies\LocationAccess;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;

class AdminLocationAccessStrategy implements LocationAccessStrategy
{
    /**
     * Administrators and Supervisors have system-wide visibility across all facilities.
     */
    public function getLocations(): array
    {
        return LocationService::getLocations();
    }

    public function getDevices(): mixed
    {
        return DeviceService::getDevices();
    }

    public function applyFilters(array &$filters): void
    {
        // No restrictions; administrators and supervisors can filter by any facility or view all
    }
}
