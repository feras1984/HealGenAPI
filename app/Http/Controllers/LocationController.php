<?php

namespace App\Http\Controllers;

use App\Facades\LocationService\LocationService;
use App\Http\Requests\LocationRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class LocationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Location/LocationList', [
            'locations' => LocationService::getLocations(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Location/LocationAdd', []);
    }

    public function store(LocationRequest $request): JsonResponse
    {
        try {
            $data = $request->all();
            $location = LocationService::store($data);

            return response()->json([
                'status' => true,
                'message' => 'Location created successfully!',
                'location' => LocationService::getLocation($location),
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while adding location!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function edit(Location $location): Response
    {
        return Inertia::render('Admin/Location/LocationEdit', [
            'location' => LocationService::getLocation($location),
        ]);
    }

    public function update(LocationRequest $request, Location $location): JsonResponse
    {
        try {
            $data = $request->all();
            LocationService::update($data, $location);

            return response()->json([
                'status' => true,
                'message' => 'Location updated successfully!',
                'location' => LocationService::getLocation($location),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating location!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function toggleActive(Location $location): JsonResponse
    {
        try {
            LocationService::toggleActive($location);

            return response()->json([
                'status' => true,
                'message' => 'Location status updated!',
                'location' => LocationService::getLocation($location),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating location status!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function validateCode(Request $request, $id = null): JsonResponse
    {
        $code = $request->code;
        $exists = LocationService::validateCode($code, $id ? (int) $id : null);

        return response()->json([
            'status' => is_null($exists),
        ]);
    }
}
