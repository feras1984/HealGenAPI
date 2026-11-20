<?php

namespace App\Strategies\MonitorScope;

use App\Strategies\LocationAccess\LocationAccessStrategy;

interface MonitorScopeStrategy extends LocationAccessStrategy
{
    /**
     * Scope the incoming filter parameters according to the user's role and boundaries.
     */
    public function scopeFilters(array $filters): array;

    /**
     * Get the accessible locations list for filter dropdowns.
     */
    public function getLocations(): array;

    /**
     * Get the accessible devices list for filter dropdowns.
     */
    public function getDevices(?int $locationId = null): array;

    /**
     * Get the scoped operational monitor dataset.
     */
    public function getMonitorData(array $filters): array;
}
