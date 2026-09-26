import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { InspectorDashboardData, InspectorFilterParams, InspectorKPIs } from "@/models/inspector/InspectorData";
import PatientHeader from "@/models/patient/PatientHeader";

@Service()
class InspectorService {
    fetchDashboardData = (filters: InspectorFilterParams = {}): Promise<AxiosResponse<{ status: boolean; data: InspectorDashboardData }>> => {
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

        return axios.get<{ status: boolean; data: InspectorDashboardData }>('/inspector/data', {
            params: cleanParams,
        });
    };

    acceptTest = (patientHeaderId: number): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: InspectorKPIs } }>> => {
        return axios.post(`/inspector/tests/${patientHeaderId}/accept`);
    };

    rejectTest = (patientHeaderId: number, reason: string): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: InspectorKPIs } }>> => {
        return axios.post(`/inspector/tests/${patientHeaderId}/reject`, { reason });
    };
}

export default InspectorService;
