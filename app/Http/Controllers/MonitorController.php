<?php

namespace App\Http\Controllers;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;
use App\Facades\MonitorService\MonitorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitorController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['locationId', 'deviceId', 'status', 'date', 'search']);
        $monitorData = MonitorService::getMonitorData($filters);
        $locations = LocationService::getLocations();
        $devices = DeviceService::getDevices();

        return Inertia::render('Admin/Monitor/MonitorList', [
            'monitorData' => $monitorData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $filters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $filters = $request->only(['locationId', 'deviceId', 'status', 'date', 'search']);
        $data = MonitorService::getMonitorData($filters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }
}
