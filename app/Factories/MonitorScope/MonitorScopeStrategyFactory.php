<?php

namespace App\Factories\MonitorScope;

use App\Models\User;
use App\Strategies\MonitorScope\AdminMonitorScopeStrategy;
use App\Strategies\MonitorScope\DenyMonitorScopeStrategy;
use App\Strategies\MonitorScope\InspectorMonitorScopeStrategy;
use App\Strategies\MonitorScope\MonitorScopeStrategy;

class MonitorScopeStrategyFactory
{
    /**
     * Resolve the appropriate MonitorScopeStrategy for the given user based on their role.
     */
    public function make(?User $user): MonitorScopeStrategy
    {
        if (!$user) {
            return new DenyMonitorScopeStrategy();
        }

        $adminRef = $user->reference()->first();
        $role = strtolower(trim($adminRef?->role ?? ''));

        return match ($role) {
            'administrator', 'supervisor' => new AdminMonitorScopeStrategy(),
            'inspector'                   => new InspectorMonitorScopeStrategy($user),
            default                       => new DenyMonitorScopeStrategy(),
        };
    }
}
