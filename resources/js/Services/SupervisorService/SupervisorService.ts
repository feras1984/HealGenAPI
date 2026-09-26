import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { SupervisorDashboardData, SupervisorFilterParams, SupervisorKPIs } from "@/models/supervisor/SupervisorData";
import PatientHeader from "@/models/patient/PatientHeader";

@Service()
class SupervisorService {
    fetchDashboardData = (filters: SupervisorFilterParams = {}): Promise<AxiosResponse<{ status: boolean; data: SupervisorDashboardData }>> => {
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

        return axios.get<{ status: boolean; data: SupervisorDashboardData }>('/supervisor/data', {
            params: cleanParams,
        });
    };

    confirmTest = (patientHeaderId: number, note?: string): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: SupervisorKPIs } }>> => {
        return axios.post(`/supervisor/tests/${patientHeaderId}/confirm`, { note });
    };

    rejectTest = (patientHeaderId: number, reason: string): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: SupervisorKPIs } }>> => {
        return axios.post(`/supervisor/tests/${patientHeaderId}/reject`, { reason });
    };
}

export default SupervisorService;
