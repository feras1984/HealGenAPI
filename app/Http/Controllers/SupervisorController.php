<?php

namespace App\Http\Controllers;

use App\Facades\DeviceService\DeviceService;
use App\Facades\LocationService\LocationService;
use App\Facades\SupervisorService\SupervisorService;
use App\Http\Requests\BulkConfirmSupervisorTestsRequest;
use App\Models\PatientHeader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class SupervisorController extends Controller
{
    private function authorizeSupervisorRole(Request $request): void
    {
        $user = $request->user();
        $adminRef = $user ? $user->reference()->first() : null;
        $role = strtolower(trim($adminRef?->role ?? ''));

        if (!in_array($role, ['administrator', 'supervisor'], true)) {
            abort(403, 'Unauthorized access. Only Supervisors and Administrators can access the supervisor queue.');
        }
    }

    public function index(Request $request): Response
    {
        $this->authorizeSupervisorRole($request);

        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);

        $dashboardData = SupervisorService::getSupervisorDashboardData($user, $filters);
        $locations = LocationService::getLocations();
        $devices = DeviceService::getDevices();

        return Inertia::render('Admin/Supervisor/SupervisorDashboard', [
            'dashboardData' => $dashboardData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $filters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorizeSupervisorRole($request);

        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);
        $data = SupervisorService::getSupervisorDashboardData($user, $filters);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function confirm(Request $request, PatientHeader $patientHeader): JsonResponse
    {
        try {
            $user = $request->user();
            $note = $request->input('note');
            $result = SupervisorService::confirmTest($patientHeader, $user, $note);

            return response()->json([
                'status' => true,
                'message' => "Test #{$patientHeader->Id} confirmed successfully!",
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
                'message' => 'Error while confirming test.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function bulkConfirm(BulkConfirmSupervisorTestsRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $ids = $request->validated('ids');
            $note = $request->validated('note');
            $result = SupervisorService::bulkConfirmTests($ids, $user, $note);

            $confirmedCount = $result['confirmedCount'];
            $skippedCount = $result['skippedCount'];

            if ($confirmedCount === 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'None of the selected tests could be confirmed because they are no longer pending supervisor review.',
                    'data' => $result,
                ], HTTPResponse::HTTP_CONFLICT);
            }

            $message = $skippedCount > 0
                ? "{$confirmedCount} test(s) confirmed and dispatched to HIS. {$skippedCount} test(s) were skipped."
                : "{$confirmedCount} test(s) confirmed and dispatched to HIS successfully!";

            return response()->json([
                'status' => true,
                'message' => $message,
                'data' => $result,
            ], HTTPResponse::HTTP_OK);
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage(),
            ], HTTPResponse::HTTP_FORBIDDEN);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while bulk confirming tests.',
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
            $result = SupervisorService::rejectTest($patientHeader, $user, $reason);

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
