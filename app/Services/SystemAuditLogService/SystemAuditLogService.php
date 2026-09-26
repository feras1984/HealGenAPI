<?php

namespace App\Services\SystemAuditLogService;

use App\Models\SystemAuditLog;
use App\Models\User;
use Carbon\Carbon;

class SystemAuditLogService
{
    /**
     * Record a system audit log entry.
     */
    public function logAction(
        ?User $user,
        string $action,
        ?string $entityType = null,
        ?string $entityId = null,
        mixed $details = null
    ): SystemAuditLog {
        $userName = 'System';
        $role = 'System';

        if ($user) {
            $adminRef = $user->reference()->first();
            if ($adminRef) {
                $firstName = $adminRef->first_name ?? $adminRef->name ?? '';
                $lastName = $adminRef->last_name ?? '';
                $fullName = trim("{$firstName} {$lastName}");
                $userName = !empty($fullName) ? $fullName : ($user->email ?? 'User #' . $user->id);
                $role = isset($adminRef->role) ? $adminRef->role : 'User';
            } else {
                $userName = $user->email ?? 'User #' . $user->id;
                $role = 'User';
            }
        }

        $formattedDetails = is_array($details) ? json_encode($details) : (string) $details;

        return SystemAuditLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name' => $userName,
            'role' => $role,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'details' => $formattedDetails,
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Get system audit logs with optional filtering.
     */
    public function getAuditLogs(array $filters = [], int $limit = 100): array
    {
        $query = SystemAuditLog::query();

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', 'like', "%{$filters['action']}%");
        }

        if (!empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('entity_type', 'like', "%{$search}%")
                  ->orWhere('entity_id', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%");
            });
        }

        $logs = $query->with('user.reference')->orderBy('id', 'desc')->limit($limit)->get();

        $mapped = [];
        foreach ($logs as $log) {
            $displayName = $log->user_name;

            if ($log->user && $log->user->reference) {
                $ref = $log->user->reference;
                $firstName = $ref->first_name ?? $ref->name ?? '';
                $lastName = $ref->last_name ?? '';
                $fullName = trim("{$firstName} {$lastName}");
                if (!empty($fullName)) {
                    $displayName = $fullName;
                }
            }

            $mapped[] = [
                'id' => $log->id,
                'userId' => $log->user_id,
                'userName' => $displayName,
                'role' => $log->role,
                'action' => $log->action,
                'entityType' => $log->entity_type,
                'entityId' => $log->entity_id,
                'details' => $log->details,
                'ipAddress' => $log->ip_address,
                'createdAt' => Carbon::make($log->created_at)->format('M d, Y H:i:s'),
            ];
        }

        return $mapped;
    }
}
