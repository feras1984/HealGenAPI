<?php

namespace App\Facades\SystemAuditLogService;

use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static \App\Models\SystemAuditLog logAction(?User $user, string $action, ?string $entityType = null, ?string $entityId = null, mixed $details = null)
 * @method static array getAuditLogs(array $filters = [], int $limit = 100)
 */
class SystemAuditLogService extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'SystemAuditLogService';
    }
}
