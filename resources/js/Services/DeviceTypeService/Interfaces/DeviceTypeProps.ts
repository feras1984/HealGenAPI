import ListProps from "@/Components/Lists/Interfaces/ListProps";
import DeviceType from "@/models/device/DeviceType";

export interface DeviceTypeGridProps {
    id: number;
    name: string;
    manufacturer: string;
    model: string;
    isActive: boolean;
    createdAt: string;
}

interface DeviceTypeProps extends ListProps {
    deviceTypes: DeviceType[];
    toggleActive?: (id: number) => void;
}

export default DeviceTypeProps;
