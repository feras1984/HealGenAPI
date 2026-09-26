<?php

namespace App\Http\Controllers;

use App\Facades\DeviceService\DeviceService;
use App\Facades\DeviceUserService\DeviceUserService;
use App\Facades\UserService\AdminService\AdminService;
use App\Http\Requests\DeviceUserRequest;
use App\Models\DeviceUser;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class DeviceUserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/DeviceUser/DeviceUserList', [
            'assignments' => DeviceUserService::getAssignments(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/DeviceUser/DeviceUserAssign', [
            'devices' => DeviceService::getDevices(),
            'users' => AdminService::getEmployees(),
        ]);
    }

    public function store(DeviceUserRequest $request): JsonResponse
    {
        try {
            $data = $request->all();
            $assignment = DeviceUserService::assign($data);

            return response()->json([
                'status' => true,
                'message' => 'Device assigned to user successfully!',
                'assignment' => DeviceUserService::mapDeviceUserModel($assignment),
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while assigning device to user!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function unassign(DeviceUser $deviceUser): JsonResponse
    {
        try {
            DeviceUserService::unassign($deviceUser);

            return response()->json([
                'status' => true,
                'message' => 'Device unassigned from user successfully!',
                'assignment' => DeviceUserService::mapDeviceUserModel($deviceUser),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while unassigning device!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function reassign(DeviceUser $deviceUser): JsonResponse
    {
        try {
            DeviceUserService::reassign($deviceUser);

            return response()->json([
                'status' => true,
                'message' => 'Device reassigned to user successfully!',
                'assignment' => DeviceUserService::mapDeviceUserModel($deviceUser),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Error while reassigning device!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
