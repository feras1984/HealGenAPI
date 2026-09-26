<?php

namespace App\Services\UserService\AdminService;

use App\Models\Admin;
use App\Models\User;
use App\Services\UserService\UserService;

class AdminService extends UserService
{
    public function mapUserModel(User $user)
    {
        $userInfo = parent::mapUserModel($user);
        $admin = $user->reference()->first();
        $normalInfo = [
            'type' => 'admin',
            'role' => $admin->role,
            'name' => $admin->first_name . ' ' . $admin->last_name,
            'firstName' => $admin->first_name,
            'lastName' => $admin->last_name,
        ];

        return [...$userInfo, ...$normalInfo];
    }

    public function mapUserShort(User $user)
    {
        $userInfo = parent::mapUserShort($user);
        return [
            ...$userInfo,
            'name' => $user->reference()->first()->first_name . ' ' . $user->reference()->first()->last_name,
        ];
    }

    public function getName(User $user)
    {
        return $user->reference()->first()->first_name . ' ' . $user->reference()->first()->last_name;
        // TODO: Implement getName() method.
    }

    public function getAdmins(): array
    {
        $admins = parent::getUsers(Admin::class);
        $adminsModel = [];
        foreach ($admins as $admin) {
            $adminsModel[] = $this->mapUserModel($admin);
        }

        return $adminsModel;
    }

    public function getEmployees(): array
    {
        $admins = parent::getUsers(Admin::class);
        $employeesModel = [];
        foreach ($admins as $admin) {
            $ref = $admin->reference()->first();
            if ($ref && strtolower($ref->role) === 'employee') {
                $employeesModel[] = $this->mapUserModel($admin);
            }
        }

        return $employeesModel;
    }

    public function getAdmin(User $user): array
    {
        return $this->mapUserModel($user);
    }

    public function store(array $data): User
    {
//        dd($data);
//        TODO: 3. Store Admin data in DB and return the user form.
        $admin = new Admin();
        $admin->fill([
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'role' => $data['role'],
        ]);
        $admin->save();
        return parent::store([
            ...$data,
            'referenceId' => $admin->id,
            'referenceType' => Admin::class,
        ]);
//        return $this->mapUserModel($user);
    }

    public function update(array $data, User $user): User
    {
//        $user = $this->mapUserModel($user);
        parent::update($data, $user);
        $admin = $user->reference()->first();
        $admin->fill([
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'role' => $data['role'],
        ]);
        $admin->update();
        return $user;
    }
}
