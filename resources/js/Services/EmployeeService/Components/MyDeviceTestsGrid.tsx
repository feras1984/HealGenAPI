import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import {
    ColumnDirective,
    ColumnsDirective,
    GridComponent,
    Inject,
    Page,
    Sort,
    Filter,
    Toolbar,
    Search
} from "@syncfusion/ej2-react-grids";
import { useEmployeeContext } from "@/Services/EmployeeService/State/EmployeeContext";
import { useAppSelector } from "@/Redux/Store/hook";

const statusColorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    'Imported': 'info',
    'Awaiting Inspection': 'warning',
    'Inspector Accepted': 'success',
    'Inspector Rejected': 'error',
    'Awaiting Supervisor': 'warning',
    'Confirmed': 'success',
    'Supervisor Rejected': 'error',
    'Failed': 'error',
    'Blocked': 'error',
    'SentToHIS': 'success',
    'FailedToSend': 'error',
};

const StatusTemplate = (props: any) => {
    const status = props.status || 'Imported';
    const color = statusColorMap[status] || 'default';
    return (
        <Chip
            label={status}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const MyDeviceTestsGrid: React.FC = () => {
    const { data } = useEmployeeContext();
    const tests = data.recentTests || [];
    const dark = useAppSelector(state => state.theme.dark);

    const mappedGridData = tests.map(pt => ({
        id: pt.id,
        patientId: pt.patientId,
        donorId: pt.donorId,
        deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
        deviceName: pt.device?.name || pt.deviceName || '-',
        locationName: pt.device?.locationName || pt.locationName || '-',
        status: pt.status,
        createdAt: pt.createdAt,
    }));

    return (
        <Card
            className="mb-6"
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" color="text.primary" className="font-semibold">
                        Tests Ingested from My Assigned Devices ({mappedGridData.length})
                    </Typography>
                </Box>
                {mappedGridData.length === 0 ? (
                    <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            No test results recorded for your assigned devices yet.
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            dataSource={mappedGridData}
                            allowPaging={true}
                            allowSorting={true}
                            allowFiltering={true}
                            pageSettings={{ pageSize: 10 }}
                            rowHeight={45}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="id" headerText="Id" width="80" textAlign="Center" />
                                <ColumnDirective field="patientId" headerText="Patient Code" width="180" textAlign="Center" />
                                <ColumnDirective field="donorId" headerText="Donor Name" width="200" textAlign="Center" />
                                <ColumnDirective field="deviceCode" headerText="Device Code" width="160" textAlign="Center" />
                                <ColumnDirective field="deviceName" headerText="Device Name" width="180" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText="Location" width="160" textAlign="Center" />
                                <ColumnDirective field="status" headerText="Status" width="180" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="createdAt" headerText="Received Time" width="160" textAlign="Center" />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter, Toolbar, Search]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default MyDeviceTestsGrid;
