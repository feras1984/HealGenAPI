import { Service } from "typedi";
import axios, { AxiosResponse } from "axios";
import { BulkConfirmResult, SupervisorDashboardData, SupervisorFilterParams, SupervisorKPIs } from "@/models/supervisor/SupervisorData";
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

        if (filters.view) {
            cleanParams.view = filters.view;
        }

        if (filters.source && filters.source !== 'all') {
            cleanParams.source = filters.source;
        }

        return axios.get<{ status: boolean; data: SupervisorDashboardData }>('/supervisor/data', {
            params: cleanParams,
        });
    };

    recordReview = (patientHeaderId: number): Promise<AxiosResponse<{ status: boolean; message: string; data: { recorded: boolean; test: PatientHeader } }>> => {
        return axios.post(`/supervisor/tests/${patientHeaderId}/review`);
    };

    confirmTest = (patientHeaderId: number, note?: string): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: SupervisorKPIs } }>> => {
        return axios.post(`/supervisor/tests/${patientHeaderId}/confirm`, { note });
    };

    bulkConfirmTests = (ids: number[], note?: string): Promise<AxiosResponse<{ status: boolean; message: string; data: BulkConfirmResult }>> => {
        return axios.post('/supervisor/tests/bulk-confirm', { ids, note });
    };

    rejectTest = (patientHeaderId: number, reason: string): Promise<AxiosResponse<{ status: boolean; message: string; data: { test: PatientHeader; kpis: SupervisorKPIs } }>> => {
        return axios.post(`/supervisor/tests/${patientHeaderId}/reject`, { reason });
    };
}

export default SupervisorService;
