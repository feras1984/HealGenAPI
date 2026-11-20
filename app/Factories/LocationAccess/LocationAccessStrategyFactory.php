<?php

namespace App\Factories\LocationAccess;

use App\Models\User;
use App\Strategies\LocationAccess\AdminLocationAccessStrategy;
use App\Strategies\LocationAccess\DenyLocationAccessStrategy;
use App\Strategies\LocationAccess\EmployeeLocationAccessStrategy;
use App\Strategies\LocationAccess\InspectorLocationAccessStrategy;
use App\Strategies\LocationAccess\LocationAccessStrategy;

class LocationAccessStrategyFactory
{
    /**
     * Resolve the appropriate LocationAccessStrategy for the given user based on their role.
     */
    public function make(?User $user): LocationAccessStrategy
    {
        if (!$user) {
            return new DenyLocationAccessStrategy();
        }

        $adminRef = $user->reference()->first();
        $role = strtolower(trim($adminRef?->role ?? ''));

        return match ($role) {
            'administrator', 'supervisor' => new AdminLocationAccessStrategy(),
            'inspector'                   => new InspectorLocationAccessStrategy($user),
            'employee'                    => new EmployeeLocationAccessStrategy($user),
            default                       => new DenyLocationAccessStrategy(),
        };
    }
}
