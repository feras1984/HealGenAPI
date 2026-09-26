import { Service } from "typedi";
import DeviceUser from "@/models/device/DeviceUser";
import { DeviceUserGridProps } from "@/Services/DeviceUserService/Interfaces/DeviceUserProps";
import axios from "axios";

@Service()
class DeviceUserService {
    mapAssignmentsGrid = (assignments: DeviceUser[]): DeviceUserGridProps[] => {
        return assignments.map(item => ({
            id: item.id,
            deviceName: item.deviceName,
            deviceCode: item.deviceCode,
            userName: item.userName,
            userEmail: item.userEmail,
            assignedAt: item.assignedAt,
            unassignedAt: item.unassignedAt,
            isActive: item.isActive,
            createdAt: item.createdAt,
        }));
    }

    assignDevice = (data: FormData | any) => {
        return axios.post<{
            status: boolean;
            message: string;
            assignment: DeviceUser;
        }>(
            '/device-users/assign',
            data
        );
    }

    unassignDevice = (id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            assignment: DeviceUser;
        }>(
            `/device-users/${id}/unassign?_method=PATCH`
        );
    }

    reassignDevice = (id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            assignment: DeviceUser;
        }>(
            `/device-users/${id}/reassign?_method=PATCH`
        );
    }
}

export default DeviceUserService;
