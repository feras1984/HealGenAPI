import PatientHeader from "@/models/patient/PatientHeader";
import Device from "@/models/device/Device";
import { StatusItem } from "@/models/monitor/MonitorData";

export interface EmployeeKPIs {
    assignedDevicesCount: number;
    testsTodayCount: number;
    pendingInspectionCount: number;
    totalIngestedCount: number;
}

export interface EmployeeFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    date?: string;
    search?: string;
}

export interface EmployeeDashboardData {
    kpis: EmployeeKPIs;
    assignedDevices: Device[];
    recentTests: PatientHeader[];
    testsByStatus?: StatusItem[];
}
