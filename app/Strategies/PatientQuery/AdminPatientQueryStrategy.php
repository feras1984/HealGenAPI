<?php

namespace App\Strategies\PatientQuery;

use Illuminate\Database\Eloquent\Builder;

class AdminPatientQueryStrategy implements PatientQueryStrategy
{
    /**
     * Administrators and Supervisors have full system-wide query access.
     */
    public function apply(Builder $query): Builder
    {
        return $query;
    }
}
