<?php

namespace App\Services\DeviceUserService;

use App\Models\DeviceUser;
use App\Models\User;
use App\Services\UserService\AdminService\AdminService;
use Carbon\Carbon;

class DeviceUserService
{
    public function mapDeviceUserModel(DeviceUser $deviceUser): array
    {
        $device = $deviceUser->device;
        $user = $deviceUser->user;

        $userName = '';
        if ($user) {
            $adminService = new AdminService();
            $userName = $adminService->getName($user) ?? $user->email;
        }

        return [
            'id' => $deviceUser->id,
            'deviceId' => $deviceUser->device_id,
            'userId' => $deviceUser->user_id,
            'deviceName' => $device ? $device->name : '',
            'deviceCode' => $device ? $device->device_code : '',
            'userName' => $userName,
            'userEmail' => $user ? $user->email : '',
            'assignedAt' => $deviceUser->assigned_at ? Carbon::make($deviceUser->assigned_at)->format('M d, Y H:i') : '',
            'unassignedAt' => $deviceUser->unassigned_at ? Carbon::make($deviceUser->unassigned_at)->format('M d, Y H:i') : '',
            'isActive' => (bool) $deviceUser->is_active,
            'createdAt' => $deviceUser->created_at ? Carbon::make($deviceUser->created_at)->format('M d, Y') : '',
        ];
    }

    public function getAssignments(): array
    {
        $assignments = DeviceUser::with(['device', 'user'])->orderBy('id', 'desc')->get();
        $list = [];
        foreach ($assignments as $assignment) {
            $list[] = $this->mapDeviceUserModel($assignment);
        }

        return $list;
    }

    public function assign(array $data): DeviceUser
    {
        $deviceId = (int) $data['deviceId'];
        $userId = (int) $data['userId'];

        $user = \App\Models\User::find($userId);
        $admin = $user ? $user->reference()->first() : null;
        if (!$admin || strtolower($admin->role) !== 'employee') {
            throw new \Exception('Only users with the Employee role can be assigned to a device.');
        }

        // If an active assignment already exists for this exact device and user, return it
        $existing = DeviceUser::where('device_id', $deviceId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if ($existing) {
            return $existing;
        }

        $assignment = new DeviceUser();
        $assignment->fill([
            'device_id' => $deviceId,
            'user_id' => $userId,
            'assigned_at' => now(),
            'unassigned_at' => null,
            'is_active' => true,
        ]);
        $assignment->save();

        return $assignment;
    }

    public function unassign(DeviceUser $deviceUser): DeviceUser
    {
        if ($deviceUser->is_active) {
            $deviceUser->is_active = false;
            $deviceUser->unassigned_at = now();
            $deviceUser->save();
        }

        return $deviceUser;
    }

    public function reassign(DeviceUser $deviceUser): DeviceUser
    {
        $user = $deviceUser->user;
        $admin = $user ? $user->reference()->first() : null;
        if (!$admin || strtolower($admin->role) !== 'employee') {
            throw new \Exception('Only users with the Employee role can be assigned to a device.');
        }

        $deviceUser->is_active = true;
        $deviceUser->assigned_at = now();
        $deviceUser->unassigned_at = null;
        $deviceUser->save();

        return $deviceUser;
    }
}
