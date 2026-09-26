<?php

namespace App\Http\Controllers;

use App\Facades\DeviceService\DeviceService;
use App\Facades\DeviceTypeService\DeviceTypeService;
use App\Facades\LocationService\LocationService;
use App\Http\Requests\DeviceRequest;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class DeviceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Device/DeviceList', [
            'devices' => DeviceService::getDevices(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Device/DeviceAdd', [
            'locations' => LocationService::getLocations(),
            'deviceTypes' => DeviceTypeService::getDeviceTypes(),
        ]);
    }

    public function store(DeviceRequest $request): JsonResponse
    {
        try {
            $data = $request->all();
            $device = DeviceService::store($data);

            return response()->json([
                'status' => true,
                'message' => 'Device created successfully!',
                'device' => DeviceService::getDevice($device),
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while creating device!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function edit(Device $device): Response
    {
        return Inertia::render('Admin/Device/DeviceEdit', [
            'device' => DeviceService::getDevice($device),
            'locations' => LocationService::getLocations(),
            'deviceTypes' => DeviceTypeService::getDeviceTypes(),
        ]);
    }

    public function update(DeviceRequest $request, Device $device): JsonResponse
    {
        try {
            $data = $request->all();
            DeviceService::update($data, $device);

            return response()->json([
                'status' => true,
                'message' => 'Device updated successfully!',
                'device' => DeviceService::getDevice($device),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating device!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function toggleActive(Device $device): JsonResponse
    {
        try {
            DeviceService::toggleActive($device);

            return response()->json([
                'status' => true,
                'message' => 'Device status updated!',
                'device' => DeviceService::getDevice($device),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating device status!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function validateCode(Request $request, $id = null): JsonResponse
    {
        $code = $request->deviceCode;
        $exists = DeviceService::validateCode($code, $id ? (int) $id : null);

        return response()->json([
            'status' => is_null($exists),
        ]);
    }
}
