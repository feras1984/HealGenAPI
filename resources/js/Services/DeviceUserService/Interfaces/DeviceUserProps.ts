import ListProps from "@/Components/Lists/Interfaces/ListProps";
import DeviceUser from "@/models/device/DeviceUser";

export interface DeviceUserGridProps {
    id: number;
    deviceName: string;
    deviceCode: string;
    userName: string;
    userEmail: string;
    assignedAt: string;
    unassignedAt: string;
    isActive: boolean;
    createdAt: string;
}

interface DeviceUserProps extends ListProps {
    assignments: DeviceUser[];
    unassign?: (id: number) => void;
    reassign?: (id: number) => void;
}

export default DeviceUserProps;
