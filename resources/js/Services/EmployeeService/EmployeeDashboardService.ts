import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { EmployeeDashboardData, EmployeeFilterParams } from "@/models/employee/EmployeeData";

@Service()
class EmployeeDashboardService {
    fetchDashboardData = (filters: EmployeeFilterParams = {}): Promise<AxiosResponse<{ status: boolean; data: EmployeeDashboardData }>> => {
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

        return axios.get<{ status: boolean; data: EmployeeDashboardData }>('/employee/data', {
            params: cleanParams,
        });
    };
}

export default EmployeeDashboardService;
