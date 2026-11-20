<?php

namespace App\Strategies\LocationAccess;

use App\Facades\LocationService\LocationService;
use App\Models\Device;
use App\Models\Location;
use App\Models\User;

class InspectorLocationAccessStrategy implements LocationAccessStrategy
{
    public function __construct(protected ?User $user) {}

    public function getLocations(): array
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        if (!$assignedLocationId) {
            return [];
        }

        $assignedLocation = Location::find($assignedLocationId);
        return $assignedLocation ? [LocationService::getLocation($assignedLocation)] : [];
    }

    public function getDevices(): mixed
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        if (!$assignedLocationId) {
            return [];
        }

        return Device::where('location_id', $assignedLocationId)
            ->where('is_active', true)
            ->get()
            ->map(fn($dev) => [
                'id' => $dev->id,
                'name' => $dev->name,
                'device_code' => $dev->device_code,
                'deviceCode' => $dev->device_code,
                'location_id' => $dev->location_id,
                'locationId' => $dev->location_id,
            ])
            ->toArray();
    }

    public function applyFilters(array &$filters): void
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        // Strictly lock to the Inspector's assigned facility; fail closed if unassigned
        $filters['locationId'] = $assignedLocationId;
    }
}
