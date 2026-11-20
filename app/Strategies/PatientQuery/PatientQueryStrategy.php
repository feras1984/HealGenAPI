<?php

namespace App\Strategies\PatientQuery;

use Illuminate\Database\Eloquent\Builder;

interface PatientQueryStrategy
{
    /**
     * Apply role-specific scoping constraints to the PatientHeader query builder.
     */
    public function apply(Builder $query): Builder;
}
