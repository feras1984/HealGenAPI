import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import InspectorContainer from "@/Services/InspectorService/State/InspectorContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { InspectorDashboardData, InspectorFilterParams } from "@/models/inspector/InspectorData";

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
    return (
        <AdminLayout>
            <Head title="Inspector Dashboard" />
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
