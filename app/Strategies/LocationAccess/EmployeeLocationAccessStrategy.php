<?php

namespace App\Strategies\LocationAccess;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;
use App\Models\DeviceUser;
use App\Models\Location;
use App\Models\User;

class EmployeeLocationAccessStrategy implements LocationAccessStrategy
{
    public function __construct(protected ?User $user) {}

    public function getLocations(): array
    {
        if (!$this->user) {
            return [];
        }

        $assignedDeviceUsers = DeviceUser::query()
            ->where('user_id', $this->user->id)
            ->where('is_active', true)
            ->with('device.location')
            ->get();

        $locations = [];
        $seen = [];
        foreach ($assignedDeviceUsers as $du) {
            $loc = $du->device?->location;
            if ($loc && !isset($seen[$loc->id])) {
                $seen[$loc->id] = true;
                $locations[] = LocationService::getLocation($loc);
            }
        }

        return $locations;
    }

    public function getDevices(): mixed
    {
        if (!$this->user) {
            return [];
        }

        $assignedDeviceUsers = DeviceUser::query()
            ->where('user_id', $this->user->id)
            ->where('is_active', true)
            ->with(['device.location', 'device.deviceType'])
            ->get();

        $devices = [];
        foreach ($assignedDeviceUsers as $du) {
            if ($du->device) {
                $devices[] = DeviceService::mapDeviceModel($du->device);
            }
        }

        return $devices;
    }

    public function applyFilters(array &$filters): void
    {
        // Employee is locked to their assigned devices
    }
}
