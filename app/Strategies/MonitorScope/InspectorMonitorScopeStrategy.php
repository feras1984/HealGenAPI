<?php

namespace App\Strategies\MonitorScope;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;
use App\Facades\MonitorService\MonitorService;
use App\Models\Device;
use App\Models\DeviceUser;
use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\User;

class InspectorMonitorScopeStrategy implements MonitorScopeStrategy
{
    public function __construct(protected ?User $user) {}

    public function scopeFilters(array $filters): array
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        // Strictly force the Inspector's assigned location (cannot be overridden via query parameter)
        $filters['locationId'] = $assignedLocationId;

        return $filters;
    }

    public function applyFilters(array &$filters): void
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        $filters['locationId'] = $assignedLocationId;
    }

    public function getLocations(): array
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        if (!$assignedLocationId) {
            return [];
        }

        $location = Location::find($assignedLocationId);
        return $location ? [LocationService::getLocation($location)] : [];
    }

    public function getDevices(?int $locationId = null): array
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();
        if (!$assignedLocationId) {
            return [];
        }

        $devices = Device::with(['location', 'deviceType'])
            ->where('location_id', $assignedLocationId)
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        $list = [];
        foreach ($devices as $dev) {
            $list[] = DeviceService::mapDeviceModel($dev);
        }

        return $list;
    }

    public function getMonitorData(array $filters): array
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();

        // If the inspector has no active location assignment, fail closed with empty dataset
        if (!$assignedLocationId) {
            return [
                'summary' => [
                    'Imported' => 0,
                    'Awaiting Inspection' => 0,
                    'Inspector Accepted' => 0,
                    'Inspector Rejected' => 0,
                    'Awaiting Supervisor' => 0,
                    'Confirmed' => 0,
                    'Supervisor Rejected' => 0,
                    'Failed' => 0,
                    'Blocked' => 0,
                    'SentToHIS' => 0,
                    'FailedToSend' => 0,
                    'total' => 0,
                ],
                'testOperations' => [],
                'deviceOperations' => [],
                'roleOperations' => [
                    'roles' => ['Administrator' => 0, 'Expert' => 0, 'Inspector' => 0, 'Employee' => 0],
                    'totalUsers' => 0,
                    'activeUsers' => 0,
                    'assignedDeviceUsers' => 0,
                ],
                'testsByStatus' => [],
                'testsOverTime' => [],
                'testsByLocation' => [],
                'testsByDevice' => [],
            ];
        }

        $filters['locationId'] = $assignedLocationId;
        $data = MonitorService::getMonitorData($filters);

        // Scope roleOperations to the Inspector's location context to prevent organizational staff leaks
        $deviceIds = Device::where('location_id', $assignedLocationId)->pluck('id');
        $locationEmployees = DeviceUser::whereIn('device_id', $deviceIds)->where('is_active', true)->distinct('user_id')->count('user_id');
        $locationInspectors = LocationInspector::where('location_id', $assignedLocationId)->where('is_active', true)->count();

        $data['roleOperations'] = [
            'roles' => [
                'Administrator' => 0,
                'Expert' => 0,
                'Inspector' => $locationInspectors,
                'Employee' => $locationEmployees,
            ],
            'totalUsers' => $locationInspectors + $locationEmployees,
            'activeUsers' => $locationInspectors + $locationEmployees,
            'assignedDeviceUsers' => $locationEmployees,
        ];

        return $data;
    }
}
