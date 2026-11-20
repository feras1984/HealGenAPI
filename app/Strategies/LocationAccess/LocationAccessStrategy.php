<?php

namespace App\Strategies\LocationAccess;

interface LocationAccessStrategy
{
    public function getLocations(): array;

    public function getDevices(): mixed;

    public function applyFilters(array &$filters): void;
}
