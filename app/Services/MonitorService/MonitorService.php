<?php

namespace App\Services\MonitorService;

use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceUser;
use App\Models\PatientHeader;
use App\Models\User;
use App\Facades\PatientService\PatientHeaderService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MonitorService
{
    /**
     * Get summary counts for all existing workflow test statuses.
     */
    public function getSummary(array $filters = []): array
    {
        $query = PatientHeader::query();

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

        $rawCounts = (clone $query)
            ->select('Status', DB::raw('COUNT(*) as total_count'))
            ->groupBy('Status')
            ->pluck('total_count', 'Status')
            ->toArray();

        $statuses = [
            'Imported',
            'Awaiting Inspection',
            'Inspector Accepted',
            'Inspector Rejected',
            'Awaiting Supervisor',
            'Confirmed',
            'Supervisor Rejected',
            'Failed',
            'Blocked',
            'SentToHIS',
            'FailedToSend',
        ];

        $summary = [];
        $totalCount = 0;
        foreach ($statuses as $st) {
            $count = (int) ($rawCounts[$st] ?? 0);
            $summary[$st] = $count;
            $totalCount += $count;
        }

        $summary['total'] = $totalCount;

        return $summary;
    }

    /**
     * Get recent test operations with device & location details.
     */
    public function getTestOperations(array $filters = [], int $limit = 25): array
    {
        $query = PatientHeader::with(['device.location', 'device.deviceType', 'tests']);

        if (!empty($filters['status'])) {
            $query->where('Status', $filters['status']);
        }

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
     * Get operational status and activity for all devices.
     */
    public function getDeviceOperations(array $filters = []): array
    {
        $query = Device::with(['location', 'deviceType']);

        if (!empty($filters['locationId'])) {
            $query->where('location_id', $filters['locationId']);
        }

        if (!empty($filters['deviceId'])) {
            $query->where('id', $filters['deviceId']);
        }

        $devices = $query->orderBy('id', 'asc')->get();

        $today = Carbon::today();

        // Database-side aggregations for device activity
        $resultsToday = PatientHeader::query()
            ->whereNotNull('device_id')
            ->whereDate('CreatedAt', $today)
            ->select('device_id', DB::raw('COUNT(*) as total_today'))
            ->groupBy('device_id')
            ->pluck('total_today', 'device_id')
            ->toArray();

        $lastResults = PatientHeader::query()
            ->whereNotNull('device_id')
            ->select('device_id', DB::raw('MAX(CreatedAt) as last_result'))
            ->groupBy('device_id')
            ->pluck('last_result', 'device_id')
            ->toArray();

        $list = [];
        foreach ($devices as $dev) {
            $lastResTime = isset($lastResults[$dev->id]) ? Carbon::make($lastResults[$dev->id])->format('M d, Y H:i') : '';
            $list[] = [
                'id' => $dev->id,
                'name' => $dev->name,
                'deviceCode' => $dev->device_code,
                'deviceTypeName' => $dev->deviceType ? $dev->deviceType->name : '',
                'locationName' => $dev->location ? $dev->location->name : '',
                'isActive' => (bool) $dev->is_active,
                'lastSeenAt' => $dev->last_seen_at ? Carbon::make($dev->last_seen_at)->format('M d, Y H:i') : '',
                'lastResultAt' => $lastResTime,
                'resultsTodayCount' => (int) ($resultsToday[$dev->id] ?? 0),
            ];
        }

        return $list;
    }

    /**
     * Get current user/role counts and assignments.
     */
    public function getRoleOperations(): array
    {
        $roleCountsRaw = Admin::select('role', DB::raw('COUNT(*) as total_count'))
            ->groupBy('role')
            ->pluck('total_count', 'role')
            ->toArray();

        $roleCounts = [
            'Administrator' => (int) ($roleCountsRaw['Administrator'] ?? 0),
            'Supervisor' => (int) ($roleCountsRaw['Supervisor'] ?? 0),
            'Inspector' => (int) ($roleCountsRaw['Inspector'] ?? 0),
            'Employee' => (int) ($roleCountsRaw['Employee'] ?? 0),
        ];

        $activeUsers = User::where('is_active', true)->count();
        $assignedUsers = DeviceUser::where('is_active', true)->distinct('user_id')->count('user_id');

        return [
            'roles' => $roleCounts,
            'totalUsers' => array_sum($roleCounts),
            'activeUsers' => $activeUsers,
            'assignedDeviceUsers' => $assignedUsers,
        ];
    }

    /**
     * Get tests grouped by status for distribution charts.
     */
    public function getTestsByStatus(array $filters = []): array
    {
        $query = PatientHeader::query();

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
     * Get tests over time (hourly for single date or daily for multi-day).
     */
    public function getTestsOverTime(array $filters = []): array
    {
        $query = PatientHeader::query();

        if (!empty($filters['locationId'])) {
            $query->whereHas('device', function ($q) use ($filters) {
                $q->where('location_id', $filters['locationId']);
            });
        }

        if (!empty($filters['deviceId'])) {
            $query->where('device_id', $filters['deviceId']);
        }

        $isSingleDate = !empty($filters['date']);
        if ($isSingleDate) {
            $query->whereDate('CreatedAt', $filters['date']);

            // Hourly aggregation for SQL Server
            $raw = $query->select(
                DB::raw('DATEPART(hour, CreatedAt) as hr'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw('DATEPART(hour, CreatedAt)'))
            ->orderBy(DB::raw('DATEPART(hour, CreatedAt)'), 'asc')
            ->get();

            $hourMap = [];
            foreach ($raw as $row) {
                $hourMap[(int) $row->hr] = (int) $row->count;
            }

            $list = [];
            for ($h = 0; $h < 24; $h++) {
                $label = sprintf('%02d:00', $h);
                $list[] = [
                    'period' => $label,
                    'count' => $hourMap[$h] ?? 0,
                ];
            }

            return $list;
        }

        // Daily aggregation (default last 7-30 days or overall)
        $raw = $query->select(
            DB::raw('CAST(CreatedAt AS DATE) as dt'),
            DB::raw('COUNT(*) as count')
        )
        ->groupBy(DB::raw('CAST(CreatedAt AS DATE)'))
        ->orderBy(DB::raw('CAST(CreatedAt AS DATE)'), 'desc')
        ->limit(14)
        ->get()
        ->reverse();

        $list = [];
        foreach ($raw as $row) {
            if ($row->dt) {
                $list[] = [
                    'period' => Carbon::make($row->dt)->format('M d'),
                    'count' => (int) $row->count,
                ];
            }
        }

        return $list;
    }

    /**
     * Get tests grouped by location.
     */
    public function getTestsByLocation(array $filters = []): array
    {
        $query = DB::table('PatientHeader')
            ->join('devices', 'PatientHeader.device_id', '=', 'devices.id')
            ->join('locations', 'devices.location_id', '=', 'locations.id')
            ->select(
                'locations.id as locationId',
                'locations.name as locationName',
                DB::raw('COUNT(PatientHeader.Id) as count')
            );

        if (!empty($filters['deviceId'])) {
            $query->where('PatientHeader.device_id', $filters['deviceId']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('PatientHeader.CreatedAt', $filters['date']);
        }

        $raw = $query->groupBy('locations.id', 'locations.name')
            ->orderBy('count', 'desc')
            ->get();

        $list = [];
        foreach ($raw as $row) {
            $list[] = [
                'locationId' => (int) $row->locationId,
                'locationName' => (string) $row->locationName,
                'count' => (int) $row->count,
            ];
        }

        return $list;
    }

    /**
     * Get top devices by test count.
     */
    public function getTestsByDevice(array $filters = [], int $limit = 10): array
    {
        $query = DB::table('PatientHeader')
            ->join('devices', 'PatientHeader.device_id', '=', 'devices.id')
            ->leftJoin('locations', 'devices.location_id', '=', 'locations.id')
            ->select(
                'devices.id as deviceId',
                'devices.name as deviceName',
                'devices.device_code as deviceCode',
                'locations.name as locationName',
                DB::raw('COUNT(PatientHeader.Id) as count')
            );

        if (!empty($filters['locationId'])) {
            $query->where('devices.location_id', $filters['locationId']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('PatientHeader.CreatedAt', $filters['date']);
        }

        $raw = $query->groupBy('devices.id', 'devices.name', 'devices.device_code', 'locations.name')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get();

        $list = [];
        foreach ($raw as $row) {
            $list[] = [
                'deviceId' => (int) $row->deviceId,
                'deviceName' => (string) $row->deviceName,
                'deviceCode' => (string) $row->deviceCode,
                'locationName' => $row->locationName ? (string) $row->locationName : 'Unassigned',
                'count' => (int) $row->count,
            ];
        }

        return $list;
    }

    /**
     * Aggregate full monitor operational data for API / view.
     */
    public function getMonitorData(array $filters = []): array
    {
        return [
            'summary' => $this->getSummary($filters),
            'testOperations' => $this->getTestOperations($filters),
            'deviceOperations' => $this->getDeviceOperations($filters),
            'roleOperations' => $this->getRoleOperations(),
            'testsByStatus' => $this->getTestsByStatus($filters),
            'testsOverTime' => $this->getTestsOverTime($filters),
            'testsByLocation' => $this->getTestsByLocation($filters),
            'testsByDevice' => $this->getTestsByDevice($filters),
        ];
    }
}
