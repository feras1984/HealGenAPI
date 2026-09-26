import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { EmployeeDashboardData, EmployeeFilterParams } from "@/models/employee/EmployeeData";

export interface EmployeeContainerProps {
    initialData: EmployeeDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: EmployeeFilterParams;
}

export interface EmployeeContextType {
    data: EmployeeDashboardData;
    locations: Location[];
    devices: Device[];
    filters: EmployeeFilterParams;
    loading: boolean;
    autoRefresh: boolean;
    lastUpdated: Date;
    setFilters: (filters: EmployeeFilterParams) => void;
    updateFilter: (key: keyof EmployeeFilterParams, value: any) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    toggleAutoRefresh: () => void;
}
