import { Service } from "typedi";
import DeviceType from "@/models/device/DeviceType";
import { DeviceTypeGridProps } from "@/Services/DeviceTypeService/Interfaces/DeviceTypeProps";
import axios from "axios";

@Service()
class DeviceTypeService {
    mapDeviceTypesGrid = (deviceTypes: DeviceType[]): DeviceTypeGridProps[] => {
        return deviceTypes.map(item => ({
            id: item.id,
            name: item.name,
            manufacturer: item.manufacturer,
            model: item.model,
            isActive: item.isActive,
            createdAt: item.createdAt,
        }));
    }

    storeDeviceType = (data: FormData | any) => {
        return axios.post<{
            status: boolean;
            message: string;
            deviceType: DeviceType;
        }>(
            '/device-types/add',
            data
        );
    }

    updateDeviceType = (data: FormData | any, id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            deviceType: DeviceType;
        }>(
            `/device-types/${id}?_method=PATCH`,
            data
        );
    }

    toggleActive = (id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            deviceType: DeviceType;
        }>(
            `/device-types/${id}/toggle-active?_method=PATCH`
        );
    }
}

export default DeviceTypeService;
