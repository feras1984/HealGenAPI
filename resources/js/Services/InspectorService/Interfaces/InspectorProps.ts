import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import PatientHeader from "@/models/patient/PatientHeader";
import { InspectorDashboardData, InspectorFilterParams } from "@/models/inspector/InspectorData";

export interface InspectorContainerProps {
    initialData: InspectorDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: InspectorFilterParams;
}

export interface InspectorContextType {
    data: InspectorDashboardData;
    locations: Location[];
    devices: Device[];
    filters: InspectorFilterParams;
    loading: boolean;
    autoRefresh: boolean;
    lastUpdated: Date;
    selectedTest: PatientHeader | null;
    isDrawerOpen: boolean;
    isAcceptDialogOpen: boolean;
    isRejectModalOpen: boolean;
    actionLoading: boolean;
    setFilters: (filters: InspectorFilterParams) => void;
    updateFilter: (key: keyof InspectorFilterParams, value: any) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    toggleAutoRefresh: () => void;
    openTestDetails: (test: PatientHeader) => void;
    closeTestDetails: () => void;
    openAcceptDialog: () => void;
    closeAcceptDialog: () => void;
    openRejectModal: () => void;
    closeRejectModal: () => void;
    handleAcceptConfirm: () => Promise<void>;
    handleRejectSubmit: (reason: string) => Promise<void>;
}
