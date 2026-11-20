<?php

namespace App\Strategies\PatientQuery;

use Illuminate\Database\Eloquent\Builder;

class DenyPatientQueryStrategy implements PatientQueryStrategy
{
    /**
     * Deny-by-default strategy for unauthenticated, unknown, or unauthorized roles.
     * Guarantees zero records leak outside of authorized contexts.
     */
    public function apply(Builder $query): Builder
    {
        return $query->whereRaw('1 = 0');
    }
}
