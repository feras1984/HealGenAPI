<?php

namespace App\Http\Controllers;

use App\Facades\UserService\AdminService\AdminService;
use App\Http\Requests\AdminRegistrationRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;

class AdminController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Administrators', [
            'users' => AdminService::getAdmins(),
        ]);
    }

    public function show(User $user): Response
    {
        return Inertia::render('Admin/Users/AdministratorEdit', [
            'user' => AdminService::getAdmin($user),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/AdministratorAdd', []);
    }

    public function store(AdminRegistrationRequest $request): JsonResponse
    {
        try {
            $data = $request->all();
            AdminService::store($data);
            return response()->json([
                'status' => true,
                'message' => "Admin added successfully!",
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $exception) {
            return \response()->json([
                'status' => false,
                'message' => 'Error while adding admin!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/AdministratorEdit', [
            'user' => AdminService::getAdmin($user),
        ]);
    }

    public function update(AdminRegistrationRequest $request, User $user): JsonResponse
    {
        try {
            $data = $request->all();
            AdminService::update($data, $user);
            return response()->json([
                'status' => true,
                'message' => "Admin updated successfully!",
                'user' => AdminService::getAdmin($user),
            ], HTTPResponse::HTTP_OK);
        } catch (\Exception $exception) {
            return \response()->json([
                'status' => false,
                'message' => 'Error while updating admin!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function upload(User $user): JsonResponse
    {
        try {
            $data = request()->all();
            $user = AdminService::updateAvatar($data, $user);
            return \response()->json([
                'status' => true,
                'message' => "Admin upload successfully!",
                'user' => $user,
            ]);
        } catch (\Exception $exception) {
            return \response()->json([
                'status' => false,
                'message' => 'Error while uploading avatar!',
                'details' => $exception->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function validateEmail(Request $request, $id = null): JsonResponse
    {
        $email = $request->email;
        $new = is_null(AdminService::validateEmail($email, $id));
        return \response()->json([
            'status' => $new,
        ]);
    }
}
