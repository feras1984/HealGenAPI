<?php

namespace App\Http\Controllers;

use App\Facades\AdminDashboardService\AdminDashboardService;
use App\Facades\DeviceService\DeviceService;
use App\Facades\EmployeeDashboardService\EmployeeDashboardService;
use App\Facades\LocationService\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardRouterController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $adminRef = $user ? $user->reference()->first() : null;
        $role = strtolower($adminRef && isset($adminRef->role) ? $adminRef->role : '');

        if ($role === 'supervisor') {
            return redirect()->route('admin.supervisor.dashboard');
        }

        if ($role === 'inspector') {
            return redirect()->route('admin.inspector.dashboard');
        }

        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);
        $locations = LocationService::getLocations();
        $devices = DeviceService::getDevices();

        if ($role === 'employee') {
            $dashboardData = EmployeeDashboardService::getEmployeeDashboardData($user, $filters);
            return Inertia::render('Admin/Employee/EmployeeDashboard', [
                'dashboardData' => $dashboardData,
                'locations' => $locations,
                'devices' => $devices,
                'initialFilters' => $filters,
            ]);
        }

        // Administrator & default system dashboard
        $dashboardData = AdminDashboardService::getAdminDashboardData($filters);
        return Inertia::render('Admin/Dashboard/AdminDashboard', [
            'dashboardData' => $dashboardData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $filters,
        ]);
    }

    public function employeeData(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);
        $data = EmployeeDashboardService::getEmployeeDashboardData($user, $filters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function adminData(Request $request): JsonResponse
    {
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);
        $data = AdminDashboardService::getAdminDashboardData($filters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }
}
