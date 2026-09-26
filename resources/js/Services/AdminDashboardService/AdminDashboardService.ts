import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { AdminDashboardData, AdminFilterParams } from "@/models/admin/AdminDashboardData";

@Service()
class AdminDashboardService {
    fetchDashboardData = (filters: AdminFilterParams = {}): Promise<AxiosResponse<{ status: boolean; data: AdminDashboardData }>> => {
        const cleanParams: Record<string, any> = {};

        if (filters.locationId && filters.locationId !== '-1' && filters.locationId !== '') {
            cleanParams.locationId = filters.locationId;
        }

        if (filters.deviceId && filters.deviceId !== '-1' && filters.deviceId !== '') {
            cleanParams.deviceId = filters.deviceId;
        }

        if (filters.date) {
            cleanParams.date = filters.date;
        }

        if (filters.search && filters.search.trim() !== '') {
            cleanParams.search = filters.search.trim();
        }

        return axios.get<{ status: boolean; data: AdminDashboardData }>('/admin/dashboard/data', {
            params: cleanParams,
        });
    };
}

export default AdminDashboardService;
