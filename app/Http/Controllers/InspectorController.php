<?php

namespace App\Http\Controllers;

use App\Facades\InspectorService\InspectorService;
use App\Factories\LocationAccess\LocationAccessStrategyFactory;
use App\Http\Requests\BulkAcceptInspectorTestsRequest;
use App\Models\PatientHeader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class InspectorController extends Controller
{
    private function authorizeInspectorQueueRole(Request $request): void
    {
        $user = $request->user();
        $adminRef = $user ? $user->reference()->first() : null;
        $role = strtolower(trim($adminRef?->role ?? ''));

        if (!in_array($role, ['administrator', 'inspector'], true)) {
            abort(403, 'Unauthorized access. Only Inspectors and Administrators can access the inspector queue.');
        }
    }

    public function index(Request $request): Response
    {
        $this->authorizeInspectorQueueRole($request);

        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);

        $strategy = app(LocationAccessStrategyFactory::class)->make($user);
        $strategy->applyFilters($filters);

        $locations = $strategy->getLocations();
        $devices = $strategy->getDevices();
        $dashboardData = InspectorService::getInspectorDashboardData($user, $filters);

        return Inertia::render('Admin/Inspector/InspectorDashboard', [
            'dashboardData' => $dashboardData,
            'locations' => $locations,
            'devices' => $devices,
            'initialFilters' => $filters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorizeInspectorQueueRole($request);

        $user = $request->user();
        $filters = $request->only(['locationId', 'deviceId', 'date', 'search']);

        $strategy = app(LocationAccessStrategyFactory::class)->make($user);
        $strategy->applyFilters($filters);

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
                'message' => "Test #{$patientHeader->Id} forwarded successfully!",
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
                'message' => 'Error while forwarding test.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function bulkAccept(BulkAcceptInspectorTestsRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $ids = $request->validated('ids');
            $result = InspectorService::bulkAcceptTests($ids, $user);

            $acceptedCount = $result['acceptedCount'];
            $skippedCount = $result['skippedCount'];
            $unauthorizedCount = $result['unauthorizedCount'] ?? 0;

            if ($acceptedCount === 0) {
                $isAllUnauthorized = $skippedCount > 0 && $unauthorizedCount === $skippedCount;
                return response()->json([
                    'status' => false,
                    'message' => $isAllUnauthorized
                        ? 'Unauthorized action. You are not authorized to forward the selected test(s).'
                        : 'None of the selected tests could be forwarded because they are no longer pending inspection.',
                    'data' => $result,
                ], $isAllUnauthorized ? HTTPResponse::HTTP_FORBIDDEN : HTTPResponse::HTTP_CONFLICT);
            }

            $message = $skippedCount > 0
                ? "{$acceptedCount} test(s) forwarded successfully. {$skippedCount} test(s) were skipped."
                : "{$acceptedCount} test(s) forwarded successfully!";

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
                'message' => 'Error while bulk forwarding tests.',
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
                'message' => "Test #{$patientHeader->Id} sent for retest.",
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
                'message' => 'Error while requesting retest.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
