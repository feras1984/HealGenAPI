<?php

namespace App\Strategies\MonitorScope;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;
use App\Facades\MonitorService\MonitorService;

class AdminMonitorScopeStrategy implements MonitorScopeStrategy
{
    public function scopeFilters(array $filters): array
    {
        return $filters;
    }

    public function applyFilters(array &$filters): void
    {
        // No restrictions for administrator and supervisor
    }

    public function getLocations(): array
    {
        return LocationService::getLocations();
    }

    public function getDevices(?int $locationId = null): array
    {
        return DeviceService::getDevices();
    }

    public function getMonitorData(array $filters): array
    {
        return MonitorService::getMonitorData($filters);
    }
}
