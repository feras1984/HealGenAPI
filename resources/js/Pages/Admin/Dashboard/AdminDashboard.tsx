import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import AdminDashboardContainer from "@/Services/AdminDashboardService/State/AdminDashboardContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { AdminDashboardData, AdminFilterParams } from "@/models/admin/AdminDashboardData";

interface AdminDashboardProps {
    dashboardData: AdminDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: AdminFilterParams;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    dashboardData,
    locations,
    devices,
    initialFilters = {}
}) => {
    return (
        <AdminLayout>
            <Head title="Administrator Dashboard" />
            <AdminDashboardContainer
                initialData={dashboardData}
                locations={locations}
                devices={devices}
                initialFilters={initialFilters}
            />
        </AdminLayout>
    );
};

export default AdminDashboard;
