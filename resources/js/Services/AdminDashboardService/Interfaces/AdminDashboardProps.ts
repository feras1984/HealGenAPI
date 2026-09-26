import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { AdminDashboardData, AdminFilterParams } from "@/models/admin/AdminDashboardData";

export interface AdminDashboardContainerProps {
    initialData: AdminDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: AdminFilterParams;
}

export interface AdminDashboardContextType {
    data: AdminDashboardData;
    locations: Location[];
    devices: Device[];
    filters: AdminFilterParams;
    loading: boolean;
    autoRefresh: boolean;
    lastUpdated: Date;
    setFilters: (filters: AdminFilterParams) => void;
    updateFilter: (key: keyof AdminFilterParams, value: any) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    toggleAutoRefresh: () => void;
}
