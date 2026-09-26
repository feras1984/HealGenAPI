import PatientHeader from "@/models/patient/PatientHeader";

export interface SupervisorKPIs {
    pendingCount: number;
    confirmedTodayCount: number;
    rejectedTodayCount: number;
    processedTodayCount: number;
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
    createdAt: string;
}

export interface SupervisorFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    date?: string;
    search?: string;
}

export interface SupervisorDashboardData {
    kpis: SupervisorKPIs;
    pendingQueue: PatientHeader[];
    recentActivity: SupervisorActionAudit[];
    activityChart?: {
        breakdown: { name: string; count: number; color: string }[];
        trend: { period: string; confirmed: number; rejected: number }[];
    };
}
