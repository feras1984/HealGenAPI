import React from 'react';
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import MonitorContainer from "@/Services/MonitorService/State/MonitorContainer";
import Location from "@/models/location/Location";
import Device from "@/models/device/Device";
import { MonitorData, MonitorFilterParams } from "@/models/monitor/MonitorData";

interface MonitorListProps {
    monitorData: MonitorData;
    locations: Location[];
    devices: Device[];
    initialFilters?: MonitorFilterParams;
}

const MonitorList: React.FC<MonitorListProps> = ({
    monitorData,
    locations,
    devices,
    initialFilters = {}
}) => {
    return (
        <AdminLayout>
            <Head title="Operational Monitor" />
            <MonitorContainer
                initialData={monitorData}
                locations={locations}
                devices={devices}
                initialFilters={initialFilters}
            />
        </AdminLayout>
    );
};

export default MonitorList;
