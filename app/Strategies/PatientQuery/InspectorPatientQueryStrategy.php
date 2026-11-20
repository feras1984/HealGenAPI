<?php

namespace App\Strategies\PatientQuery;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class InspectorPatientQueryStrategy implements PatientQueryStrategy
{
    public function __construct(protected ?User $user) {}

    /**
     * Strictly constrain patient query to tests originating from devices
     * associated with the Inspector's currently assigned location.
     * Fails closed (empty set) if the inspector has no active location assignment.
     */
    public function apply(Builder $query): Builder
    {
        $assignedLocationId = $this->user?->getAssignedLocationId();

        if (!$assignedLocationId) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('device', function (Builder $q) use ($assignedLocationId) {
            $q->where('location_id', $assignedLocationId);
        });
    }
}
