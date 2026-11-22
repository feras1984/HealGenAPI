<?php

namespace App\Services\EmployeeService;

use App\Models\Device;
use App\Models\DeviceUser;
use App\Models\PatientHeader;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use App\Facades\DeviceService\DeviceService;
use Carbon\Carbon;

use Illuminate\Support\Facades\DB;

class EmployeeDashboardService
{
    /**
     * Get IDs of devices assigned to the given user.
     */
    public function getAssignedDeviceIds(User $user): array
    {
        return DeviceUser::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('device_id')
            ->toArray();
    }

    /**
     * Get KPI summary counts for Employee dashboard.
     */
    public function getDashboardKPIs(array $assignedDeviceIds): array
    {
        $assignedCount = count($assignedDeviceIds);
        $today = Carbon::today();

        if (empty($assignedDeviceIds)) {
            return [
                'assignedDevicesCount' => 0,
                'testsTodayCount' => 0,
                'pendingInspectionCount' => 0,
                'totalIngestedCount' => 0,
            ];
        }

        $testsTodayCount = PatientHeader::query()
            ->whereIn('DeviceId', $assignedDeviceIds)
            ->whereDate('CreatedAt', $today)
            ->count();

        $pendingInspectionCount = PatientHeader::query()
            ->whereIn('DeviceId', $assignedDeviceIds)
            ->whereIn('Status', ['Imported', 'Awaiting Inspection'])
            ->count();

        $totalIngestedCount = PatientHeader::query()
            ->whereIn('DeviceId', $assignedDeviceIds)
            ->count();

        return [
            'assignedDevicesCount' => $assignedCount,
            'testsTodayCount' => $testsTodayCount,
            'pendingInspectionCount' => $pendingInspectionCount,
            'totalIngestedCount' => $totalIngestedCount,
        ];
    }

    /**
     * Get list of assigned devices for Employee.
     */
    public function getAssignedDevices(array $assignedDeviceIds): array
    {
        if (empty($assignedDeviceIds)) {
            return [];
        }

        $devices = Device::with(['location', 'deviceType'])
            ->whereIn('id', $assignedDeviceIds)
            ->get();

        $mapped = [];
        foreach ($devices as $dev) {
            $mapped[] = DeviceService::mapDeviceModel($dev);
        }

        return $mapped;
    }

    /**
     * Get recent tests scoped strictly to employee's assigned devices.
     */
    public function getMyDeviceTests(array $assignedDeviceIds, array $filters = [], int $limit = 50): array
    {
        if (empty($assignedDeviceIds)) {
            return [];
        }

        $query = PatientHeader::with([
            'device.location',
            'device.deviceType',
            'tests',
            'file',
            'latestInspectorAction.user.reference',
            'latestSupervisorAction.user.reference',
        ])
            ->whereIn('DeviceId', $assignedDeviceIds);

        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('DeviceId', $filters['deviceId']);
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
                  ->orWhere('DeviceCode', 'like', "%{$search}%");
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
     * Get tests grouped by status for assigned devices distribution chart.
     */
    public function getTestsByStatus(array $assignedDeviceIds, array $filters = []): array
    {
        if (empty($assignedDeviceIds)) {
            return [];
        }

        $query = PatientHeader::query()->whereIn('DeviceId', $assignedDeviceIds);

        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('DeviceId', $filters['deviceId']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('CreatedAt', $filters['date']);
        }

        $raw = $query->select('Status', DB::raw('COUNT(*) as count'))
            ->groupBy('Status')
            ->orderBy('count', 'desc')
            ->get();

        $list = [];
        foreach ($raw as $item) {
            if (!empty($item->Status)) {
                $list[] = [
                    'status' => $item->Status,
                    'count' => (int) $item->count,
                ];
            }
        }

        return $list;
    }

    /**
     * Get aggregate dashboard payload for Employee.
     */
    public function getEmployeeDashboardData(User $user, array $filters = []): array
    {
        $assignedDeviceIds = $this->getAssignedDeviceIds($user);

        return [
            'kpis' => $this->getDashboardKPIs($assignedDeviceIds),
            'assignedDevices' => $this->getAssignedDevices($assignedDeviceIds),
            'recentTests' => $this->getMyDeviceTests($assignedDeviceIds, $filters),
            'testsByStatus' => $this->getTestsByStatus($assignedDeviceIds, $filters),
        ];
    }
}
