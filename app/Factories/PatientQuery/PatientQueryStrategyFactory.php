<?php

namespace App\Factories\PatientQuery;

use App\Models\User;
use App\Strategies\PatientQuery\AdminPatientQueryStrategy;
use App\Strategies\PatientQuery\DenyPatientQueryStrategy;
use App\Strategies\PatientQuery\EmployeePatientQueryStrategy;
use App\Strategies\PatientQuery\InspectorPatientQueryStrategy;
use App\Strategies\PatientQuery\PatientQueryStrategy;

class PatientQueryStrategyFactory
{
    /**
     * Resolve the appropriate PatientQueryStrategy for the given user based on their role.
     */
    public function make(?User $user): PatientQueryStrategy
    {
        if (!$user) {
            return new DenyPatientQueryStrategy();
        }

        $adminRef = $user->reference()->first();
        $role = strtolower(trim($adminRef?->role ?? ''));

        return match ($role) {
            'administrator', 'expert'     => new AdminPatientQueryStrategy(),
            'inspector'                   => new InspectorPatientQueryStrategy($user),
            'employee'                    => new EmployeePatientQueryStrategy($user),
            default                       => new DenyPatientQueryStrategy(),
        };
    }
}
