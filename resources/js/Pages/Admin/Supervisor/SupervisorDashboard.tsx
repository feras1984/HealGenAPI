import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import SupervisorContainer from "@/Services/SupervisorService/State/SupervisorContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { SupervisorDashboardData, SupervisorFilterParams } from "@/models/supervisor/SupervisorData";
import { useTranslation } from "react-i18next";

interface SupervisorDashboardProps {
    dashboardData: SupervisorDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: SupervisorFilterParams;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
    dashboardData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const { t } = useTranslation();

    return (
        <AdminLayout>
            <Head title={t('supervisor.dashboard') || "Expert Dashboard"} />
            <SupervisorContainer
                initialData={dashboardData}
                locations={locations}
                devices={devices}
                initialFilters={initialFilters}
            />
        </AdminLayout>
    );
};

export default SupervisorDashboard;
