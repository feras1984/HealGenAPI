export interface SystemAuditLogItem {
    id: number;
    userId?: number;
    userName?: string;
    role?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    createdAt: string;
}

export interface AuditLogFilterParams {
    role?: string;
    action?: string;
    date?: string;
    search?: string;
}
