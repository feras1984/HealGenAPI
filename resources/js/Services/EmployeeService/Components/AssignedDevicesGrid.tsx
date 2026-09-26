import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import {
    ColumnDirective,
    ColumnsDirective,
    GridComponent,
    Inject,
    Page,
    Sort,
    Filter
} from "@syncfusion/ej2-react-grids";
import { useEmployeeContext } from "@/Services/EmployeeService/State/EmployeeContext";
import { useAppSelector } from "@/Redux/Store/hook";

const StatusTemplate = (props: any) => {
    const isActive = props.isActive;
    return (
        <Chip
            label={isActive ? "Active" : "Inactive"}
            color={isActive ? "success" : "default"}
            size="small"
            variant="filled"
        />
    );
};

const AssignedDevicesGrid: React.FC = () => {
    const { data } = useEmployeeContext();
    const devices = data.assignedDevices || [];
    const dark = useAppSelector(state => state.theme.dark);

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
                        My Assigned Devices ({devices.length})
                    </Typography>
                </Box>
                {devices.length === 0 ? (
                    <Box className="p-6 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            You currently have no assigned devices. Contact your Administrator to assign devices to your account.
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            dataSource={devices}
                            allowPaging={true}
                            allowSorting={true}
                            allowFiltering={true}
                            pageSettings={{ pageSize: 5 }}
                            rowHeight={45}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="deviceCode" headerText="Device Code" width="160" textAlign="Center" />
                                <ColumnDirective field="name" headerText="Device Name" width="200" textAlign="Center" />
                                <ColumnDirective field="deviceTypeName" headerText="Device Type" width="180" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText="Location" width="160" textAlign="Center" />
                                <ColumnDirective field="isActive" headerText="Status" width="130" textAlign="Center" template={StatusTemplate} />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default AssignedDevicesGrid;
