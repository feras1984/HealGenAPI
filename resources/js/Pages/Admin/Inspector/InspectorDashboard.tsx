import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import InspectorContainer from "@/Services/InspectorService/State/InspectorContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { InspectorDashboardData, InspectorFilterParams } from "@/models/inspector/InspectorData";
import { useTranslation } from "react-i18next";

interface InspectorDashboardProps {
    dashboardData: InspectorDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: InspectorFilterParams;
}

const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
    dashboardData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const { t } = useTranslation();

    return (
        <AdminLayout>
            <Head title={t('inspector.dashboard') || "Inspector Dashboard"} />
            <InspectorContainer
                initialData={dashboardData}
                locations={locations}
                devices={devices}
                initialFilters={initialFilters}
            />
        </AdminLayout>
    );
};

export default InspectorDashboard;
