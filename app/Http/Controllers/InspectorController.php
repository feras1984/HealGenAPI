<?php

namespace App\Http\Controllers;

use App\Facades\DeviceService\DeviceService;
use App\Facades\InspectorService\InspectorService;
use App\Facades\LocationService\LocationService;
use App\Models\PatientHeader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class InspectorController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);

        $dashboardData = InspectorService::getInspectorDashboardData($user, $filters);
        $locations = LocationService::getLocations();
        $devices = DeviceService::getDevices();

        return Inertia::render('Admin/Inspector/InspectorDashboard', [
            'dashboardData' => $dashboardData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $filters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);
        $data = InspectorService::getInspectorDashboardData($user, $filters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function accept(Request $request, PatientHeader $patientHeader): JsonResponse
    {
        try {
            $user = $request->user();
//            dd($user);
            $result = InspectorService::acceptTest($patientHeader, $user);

            return response()->json([
                'status' => true,
                'message' => "Test #{$patientHeader->Id} accepted successfully!",
                'data' => $result,
            ], HTTPResponse::HTTP_OK);
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage(),
            ], HTTPResponse::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage(),
            ], HTTPResponse::HTTP_CONFLICT);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while accepting test.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function reject(Request $request, PatientHeader $patientHeader): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        try {
            $user = $request->user();
            $reason = (string) $request->input('reason');
            $result = InspectorService::rejectTest($patientHeader, $user, $reason);

            return response()->json([
                'status' => true,
                'message' => "Test #{$patientHeader->Id} rejected.",
                'data' => $result,
            ], HTTPResponse::HTTP_OK);
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage(),
            ], HTTPResponse::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage(),
            ], HTTPResponse::HTTP_CONFLICT);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while rejecting test.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
