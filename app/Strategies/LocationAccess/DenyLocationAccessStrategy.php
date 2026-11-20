<?php

namespace App\Strategies\LocationAccess;

class DenyLocationAccessStrategy implements LocationAccessStrategy
{
    public function getLocations(): array
    {
        return [];
    }

    public function getDevices(): mixed
    {
        return [];
    }

    public function applyFilters(array &$filters): void
    {
        $filters['locationId'] = -1;
    }
}
