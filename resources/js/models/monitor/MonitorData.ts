import PatientHeader from "@/models/patient/PatientHeader";

export interface MonitorSummary {
    Imported: number;
    'Awaiting Inspection': number;
    'Inspector Accepted': number;
    'Inspector Rejected': number;
    'Awaiting Supervisor': number;
    Confirmed: number;
    'Supervisor Rejected': number;
    Failed: number;
    Blocked: number;
    SentToHIS: number;
    FailedToSend: number;
    total: number;
}

export interface DeviceOperation {
    id: number;
    name: string;
    deviceCode: string;
    deviceTypeName: string;
    locationName: string;
    isActive: boolean;
    lastSeenAt: string;
    lastResultAt: string;
    resultsTodayCount: number;
}

export interface RoleOperationsSummary {
    roles: {
        Administrator: number;
        Supervisor: number;
        Inspector: number;
        Employee: number;
    };
    totalUsers: number;
    activeUsers: number;
    assignedDeviceUsers: number;
}

export interface StatusItem {
    status: string;
    count: number;
}

export interface TimePoint {
    period: string;
    count: number;
}

export interface LocationCount {
    locationId: number;
    locationName: string;
    count: number;
}

export interface DeviceCount {
    deviceId: number;
    deviceName: string;
    deviceCode: string;
    locationName: string;
    count: number;
}

export interface MonitorFilterParams {
    locationId?: string | number;
    deviceId?: string | number;
    status?: string;
    date?: string;
    search?: string;
}

export interface MonitorData {
    summary: MonitorSummary;
    testOperations: PatientHeader[];
    deviceOperations: DeviceOperation[];
    roleOperations: RoleOperationsSummary;
    testsByStatus?: StatusItem[];
    testsOverTime?: TimePoint[];
    testsByLocation?: LocationCount[];
    testsByDevice?: DeviceCount[];
}
