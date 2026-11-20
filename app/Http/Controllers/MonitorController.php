<?php

namespace App\Http\Controllers;

use App\Factories\MonitorScope\MonitorScopeStrategyFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitorController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $strategy = app(MonitorScopeStrategyFactory::class)->make($user);

        $rawFilters = $request->only(['locationId', 'deviceId', 'status', 'date', 'search']);
        $scopedFilters = $strategy->scopeFilters($rawFilters);

        $monitorData = $strategy->getMonitorData($scopedFilters);
        $locations = $strategy->getLocations();
        $devices = $strategy->getDevices();

        return Inertia::render('Admin/Monitor/MonitorList', [
            'monitorData' => $monitorData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $scopedFilters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $user = $request->user();
        $strategy = app(MonitorScopeStrategyFactory::class)->make($user);

        $rawFilters = $request->only(['locationId', 'deviceId', 'status', 'date', 'search']);
        $scopedFilters = $strategy->scopeFilters($rawFilters);
        $data = $strategy->getMonitorData($scopedFilters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }
}
