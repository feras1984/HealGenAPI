<?php

namespace App\Services\AdminDashboardService;

use App\Models\Device;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use Carbon\Carbon;

class AdminDashboardService
{
    /**
     * Get system-wide KPIs for Administrator dashboard.
     */
    public function getAdminDashboardKPIs(): array
    {
        $today = Carbon::today();

        $totalLocations = Location::count();
        $totalDevices = Device::count();
        $activeDevices = Device::where('is_active', true)->count();
        $totalUsers = User::count();

        $todayOperations = PatientHeader::whereDate('CreatedAt', $today)->count();
        $pendingInspectorCount = PatientHeader::whereIn('Status', ['Imported', 'Awaiting Inspection'])->count();
        $pendingSupervisorCount = PatientHeader::whereIn('Status', ['Inspector Accepted', 'Awaiting Supervisor'])->count();
        $sentToHisCount = PatientHeader::where('Status', 'SentToHIS')->count();

        return [
            'totalLocations' => $totalLocations,
            'totalDevices' => $totalDevices,
            'activeDevices' => $activeDevices,
            'totalUsers' => $totalUsers,
            'todayOperations' => $todayOperations,
            'pendingInspectorCount' => $pendingInspectorCount,
            'pendingSupervisorCount' => $pendingSupervisorCount,
            'sentToHisCount' => $sentToHisCount,
        ];
    }

    /**
     * Get recent system-wide test operations.
     */
    public function getRecentSystemOperations(array $filters = [], int $limit = 50): array
    {
        $query = PatientHeader::with(['device.location', 'device.deviceType', 'tests']);

        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('device_id', $filters['deviceId']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('CreatedAt', $filters['date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('PatientId', 'like', "%{$search}%")
                  ->orWhere('DonorId', 'like', "%{$search}%")
                  ->orWhere('CollectionSite', 'like', "%{$search}%")
                  ->orWhere('device_code', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('Id', 'desc')->limit($limit)->get();

        $list = [];
        foreach ($patients as $patient) {
            $list[] = PatientHeaderService::mapPatientModel($patient);
        }

        return $list;
    }

    /**
     * Get aggregate dashboard payload for Administrator.
     */
    public function getAdminDashboardData(array $filters = []): array
    {
        return [
            'kpis' => $this->getAdminDashboardKPIs(),
            'recentOperations' => $this->getRecentSystemOperations($filters),
            'testsByStatus' => \App\Facades\MonitorService\MonitorService::getTestsByStatus($filters),
            'testsOverTime' => \App\Facades\MonitorService\MonitorService::getTestsOverTime($filters),
            'testsByLocation' => \App\Facades\MonitorService\MonitorService::getTestsByLocation($filters),
        ];
    }
}
