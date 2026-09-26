<?php

namespace App\Http\Controllers;

use App\Facades\DeviceTypeService\DeviceTypeService;
use App\Http\Requests\DeviceTypeRequest;
use App\Models\DeviceType;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class DeviceTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/DeviceType/DeviceTypeList', [
            'deviceTypes' => DeviceTypeService::getDeviceTypes(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/DeviceType/DeviceTypeAdd', []);
    }

    public function store(DeviceTypeRequest $request): JsonResponse
    {
        try {
            $data = $request->all();
            $deviceType = DeviceTypeService::store($data);

            return response()->json([
                'status' => true,
                'message' => 'Device Type created successfully!',
                'deviceType' => DeviceTypeService::getDeviceType($deviceType),
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while creating device type!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function edit(DeviceType $deviceType): Response
    {
        return Inertia::render('Admin/DeviceType/DeviceTypeEdit', [
            'deviceType' => DeviceTypeService::getDeviceType($deviceType),
        ]);
    }

    public function update(DeviceTypeRequest $request, DeviceType $deviceType): JsonResponse
    {
        try {
            $data = $request->all();
            DeviceTypeService::update($data, $deviceType);

            return response()->json([
                'status' => true,
                'message' => 'Device Type updated successfully!',
                'deviceType' => DeviceTypeService::getDeviceType($deviceType),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating device type!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function toggleActive(DeviceType $deviceType): JsonResponse
    {
        try {
            DeviceTypeService::toggleActive($deviceType);

            return response()->json([
                'status' => true,
                'message' => 'Device Type status updated!',
                'deviceType' => DeviceTypeService::getDeviceType($deviceType),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while updating device type status!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
