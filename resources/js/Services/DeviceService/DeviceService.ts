import { Service } from "typedi";
import Device from "@/models/device/Device";
import { DeviceGridProps } from "@/Services/DeviceService/Interfaces/DeviceProps";
import axios, { AxiosResponse } from "axios";

@Service()
class DeviceService {
    mapDevicesGrid = (devices: Device[]): DeviceGridProps[] => {
        return devices.map(item => ({
            id: item.id,
            name: item.name,
            deviceCode: item.deviceCode,
            locationName: item.locationName,
            deviceTypeName: item.deviceTypeName,
            serialNumber: item.serialNumber,
            ipAddress: item.ipAddress,
            isActive: item.isActive,
            createdAt: item.createdAt,
        }));
    }

    storeDevice = (data: FormData | any) => {
        return axios.post<{
            status: boolean;
            message: string;
            device: Device;
        }>(
            '/devices/add',
            data
        );
    }

    updateDevice = (data: FormData | any, id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            device: Device;
        }>(
            `/devices/${id}?_method=PATCH`,
            data
        );
    }

    toggleActive = (id: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            device: Device;
        }>(
            `/devices/${id}/toggle-active?_method=PATCH`
        );
    }

    validateCode = (deviceCode: string, id?: number) => {
        return axios.post<AxiosResponse<{ status: boolean }>>(
            `/devices/validate/code/${id || -1}`,
            { deviceCode: deviceCode }
        );
    }
}

export default DeviceService;
