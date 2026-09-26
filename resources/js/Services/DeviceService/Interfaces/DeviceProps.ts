import ListProps from "@/Components/Lists/Interfaces/ListProps";
import Device from "@/models/device/Device";

export interface DeviceGridProps {
    id: number;
    name: string;
    deviceCode: string;
    locationName: string;
    deviceTypeName: string;
    serialNumber: string;
    ipAddress: string;
    isActive: boolean;
    createdAt: string;
}

interface DeviceProps extends ListProps {
    devices: Device[];
    toggleActive?: (id: number) => void;
}

export default DeviceProps;
