import { StatusItem, TimePoint, LocationCount } from "@/models/monitor/MonitorData";
import PatientHeader from "@/models/patient/PatientHeader";

export interface AdminKPIs {
    totalLocations: number;
    totalDevices: number;
    activeDevices: number;
    totalUsers: number;
    todayOperations: number;
    pendingInspectorCount: number;
    pendingSupervisorCount: number;
    sentToHisCount: number;
}

export interface AdminFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    date?: string;
    search?: string;
}

export interface AdminDashboardData {
    kpis: AdminKPIs;
    recentOperations: PatientHeader[];
    testsByStatus?: StatusItem[];
    testsOverTime?: TimePoint[];
    testsByLocation?: LocationCount[];
}
