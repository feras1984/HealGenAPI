import PatientHeader from "@/models/patient/PatientHeader";

export interface InspectorKPIs {
    pendingCount: number;
    acceptedTodayCount: number;
    rejectedTodayCount: number;
    inspectedTodayCount: number;
}

export interface InspectorActionAudit {
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

export interface InspectorFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    date?: string;
    search?: string;
}

export interface InspectorDashboardData {
    kpis: InspectorKPIs;
    pendingQueue: PatientHeader[];
    recentActivity: InspectorActionAudit[];
    activityChart?: {
        breakdown: { name: string; count: number; color: string }[];
        trend: { period: string; accepted: number; rejected: number }[];
    };
}
