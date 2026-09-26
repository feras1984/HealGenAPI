<?php

namespace App\Http\Controllers;

use App\Facades\SystemAuditLogService\SystemAuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemAuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['role', 'action', 'date', 'search']);
        $logs = SystemAuditLogService::getAuditLogs($filters);

        return Inertia::render('Admin/AuditLog/AuditLogList', [
            'logs' => $logs,
            'initialFilters' => $filters,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'action', 'date', 'search']);
        $logs = SystemAuditLogService::getAuditLogs($filters);

        return response()->json([
            'status' => true,
            'data' => $logs,
        ]);
    }
}
