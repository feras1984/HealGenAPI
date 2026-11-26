import PatientHeader from "@/models/patient/PatientHeader";

export type ExpertQueueView = 'pending' | 'confirmed' | 'rejected' | 'all';
export type ExpertQueueSource = 'all' | 'direct' | 'inspected';

export interface SupervisorKPIs {
    pendingCount: number;
    directPendingCount?: number;
    inspectorForwardedPendingCount?: number;
    confirmedTodayCount: number;
    rejectedTodayCount: number;
    processedTodayCount: number;
    totalConfirmedCount?: number;
    totalRejectedCount?: number;
}

export interface SupervisorActionAudit {
    id: number;
    patientHeaderId: number;
    patientCode: string;
    donorName: string;
    action: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    isDirect?: boolean;
    createdAt: string;
}

export interface SupervisorFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    date?: string;
    search?: string;
    view?: ExpertQueueView;
    source?: ExpertQueueSource;
}

export interface BulkSkippedTest {
    id: number;
    reason: string;
    code?: string;
}

export interface BulkConfirmResult {
    confirmedIds: number[];
    confirmedCount: number;
    skipped: BulkSkippedTest[];
    skippedCount: number;
    kpis: SupervisorKPIs;
}

export interface SupervisorDashboardData {
    activeView?: ExpertQueueView;
    kpis: SupervisorKPIs;
    pendingQueue: PatientHeader[];
    tests?: PatientHeader[];
    recentActivity: SupervisorActionAudit[];
    activityChart?: {
        breakdown: { name: string; count: number; color: string }[];
        trend: { period: string; confirmed: number; rejected: number }[];
    };
}
