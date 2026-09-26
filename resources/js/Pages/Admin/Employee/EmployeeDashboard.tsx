import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import EmployeeContainer from "@/Services/EmployeeService/State/EmployeeContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { EmployeeDashboardData, EmployeeFilterParams } from "@/models/employee/EmployeeData";

interface EmployeeDashboardProps {
    dashboardData: EmployeeDashboardData;
    locations: Location[];
    devices: Device[];
    initialFilters?: EmployeeFilterParams;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
    dashboardData,
    locations,
    devices,
    initialFilters = {}
}) => {
    return (
        <AdminLayout>
            <Head title="Employee Dashboard" />
            <EmployeeContainer
                initialData={dashboardData}
                locations={locations}
                devices={devices}
                initialFilters={initialFilters}
            />
        </AdminLayout>
    );
};

export default EmployeeDashboard;
