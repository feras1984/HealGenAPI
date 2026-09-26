import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { MonitorData, MonitorFilterParams } from "@/models/monitor/MonitorData";

export interface MonitorContainerProps {
    initialData: MonitorData;
    locations: Location[];
    devices: Device[];
    initialFilters?: MonitorFilterParams;
}

export interface MonitorContextType {
    data: MonitorData;
    locations: Location[];
    devices: Device[];
    filters: MonitorFilterParams;
    loading: boolean;
    autoRefresh: boolean;
    lastUpdated: Date;
    setFilters: (filters: MonitorFilterParams) => void;
    updateFilter: (key: keyof MonitorFilterParams, value: any) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    toggleAutoRefresh: () => void;
}
