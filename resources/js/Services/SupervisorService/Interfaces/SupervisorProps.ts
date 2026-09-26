import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import PatientHeader from "@/models/patient/PatientHeader";
import { SupervisorDashboardData, SupervisorFilterParams } from "@/models/supervisor/SupervisorData";

export interface SupervisorContainerProps {
    initialData: SupervisorDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: SupervisorFilterParams;
}

export interface SupervisorContextType {
    data: SupervisorDashboardData;
    locations: Location[];
    devices: Device[];
    filters: SupervisorFilterParams;
    loading: boolean;
    autoRefresh: boolean;
    lastUpdated: Date;
    selectedTest: PatientHeader | null;
    isDrawerOpen: boolean;
    isConfirmDialogOpen: boolean;
    isRejectModalOpen: boolean;
    actionLoading: boolean;
    setFilters: (filters: SupervisorFilterParams) => void;
    updateFilter: (key: keyof SupervisorFilterParams, value: any) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    toggleAutoRefresh: () => void;
    openTestDetails: (test: PatientHeader) => void;
    closeTestDetails: () => void;
    openConfirmDialog: () => void;
    closeConfirmDialog: () => void;
    openRejectModal: () => void;
    closeRejectModal: () => void;
    handleConfirmSubmit: (note?: string) => Promise<void>;
    handleRejectSubmit: (reason: string) => Promise<void>;
}
