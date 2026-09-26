import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { MonitorData, MonitorFilterParams } from "@/models/monitor/MonitorData";

@Service()
class MonitorService {
    fetchMonitorData = (filters: MonitorFilterParams = {}): Promise<AxiosResponse<{ status: boolean; data: MonitorData }>> => {
        const cleanParams: Record<string, any> = {};

        if (filters.locationId && filters.locationId !== '-1' && filters.locationId !== '') {
            cleanParams.locationId = filters.locationId;
        }

        if (filters.deviceId && filters.deviceId !== '-1' && filters.deviceId !== '') {
            cleanParams.deviceId = filters.deviceId;
        }

        if (filters.status && filters.status !== 'All' && filters.status !== '') {
            cleanParams.status = filters.status;
        }

        if (filters.date) {
            cleanParams.date = filters.date;
        }

        if (filters.search && filters.search.trim() !== '') {
            cleanParams.search = filters.search.trim();
        }

        return axios.get<{ status: boolean; data: MonitorData }>('/monitor/data', {
            params: cleanParams,
        });
    };
}

export default MonitorService;
