<?php

namespace App\Strategies\PatientQuery;

use App\Models\DeviceUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class EmployeePatientQueryStrategy implements PatientQueryStrategy
{
    public function __construct(protected ?User $user) {}

    /**
     * Strictly constrain patient query to tests originating from devices
     * currently assigned to the authenticated Employee.
     * Fails closed (empty set) if the employee has no active device assignments.
     */
    public function apply(Builder $query): Builder
    {
        if (!$this->user) {
            return $query->whereRaw('1 = 0');
        }

        $assignedDeviceIds = DeviceUser::query()
            ->where('user_id', $this->user->id)
            ->where('is_active', true)
            ->pluck('device_id')
            ->toArray();

        if (empty($assignedDeviceIds)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('DeviceId', $assignedDeviceIds);
    }
}
