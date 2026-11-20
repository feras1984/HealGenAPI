<?php

namespace App\Strategies\MonitorScope;

class DenyMonitorScopeStrategy implements MonitorScopeStrategy
{
    public function scopeFilters(array $filters): array
    {
        return ['locationId' => -1];
    }

    public function applyFilters(array &$filters): void
    {
        $filters['locationId'] = -1;
    }

    public function getLocations(): array
    {
        return [];
    }

    public function getDevices(?int $locationId = null): array
    {
        return [];
    }

    public function getMonitorData(array $filters): array
    {
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
                'roles' => ['Administrator' => 0, 'Supervisor' => 0, 'Inspector' => 0, 'Employee' => 0],
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
}
