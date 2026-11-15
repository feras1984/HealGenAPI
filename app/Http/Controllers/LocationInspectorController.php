<?php

namespace App\Http\Controllers;

use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Facades\LocationService\LocationService;
use App\Facades\UserService\AdminService\AdminService;
use App\Models\LocationInspector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class LocationInspectorController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $filters = $request->only(['locationId', 'userId', 'isActive']);
        $assignments = LocationInspectorService::getAssignments($filters);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => true,
                'data' => $assignments,
            ]);
        }

        return Inertia::render('Admin/LocationInspector/LocationInspectorList', [
            'assignments' => $assignments,
            'locations' => LocationService::getLocations(),
            'inspectors' => AdminService::getInspectors(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|integer|exists:locations,id',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        try {
            $actor = $request->user();
            $assignment = LocationInspectorService::assign(
                (int) $validated['location_id'],
                (int) $validated['user_id'],
                $actor
            );

            return response()->json([
                'status' => true,
                'message' => 'Inspector assigned to location successfully!',
                'assignment' => LocationInspectorService::mapAssignmentModel($assignment),
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while assigning inspector to location.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function transfer(Request $request, LocationInspector $locationInspector): JsonResponse
    {
        $validated = $request->validate([
            'new_location_id' => 'required|integer|exists:locations,id',
        ]);

        try {
            $actor = $request->user();
            $newAssignment = LocationInspectorService::transfer(
                $locationInspector->user_id,
                (int) $validated['new_location_id'],
                $actor
            );

            return response()->json([
                'status' => true,
                'message' => 'Inspector transferred to new location successfully!',
                'assignment' => LocationInspectorService::mapAssignmentModel($newAssignment),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while transferring inspector.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function unassign(Request $request, LocationInspector $locationInspector): JsonResponse
    {
        try {
            $actor = $request->user();
            LocationInspectorService::unassign($locationInspector->id, $actor);

            return response()->json([
                'status' => true,
                'message' => 'Inspector unassigned from location successfully!',
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while unassigning inspector.',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
