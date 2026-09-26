import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const ActionTemplate = (props: any) => {
    const { openTestDetails } = useSupervisorContext();
    const rowData = props;
    return (
        <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => openTestDetails(rowData.rawPatient)}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
        >
            Review
        </Button>
    );
};

const StatusTemplate = (props: any) => {
    return (
        <Chip
            label={props.status || 'Awaiting Supervisor'}
            color="secondary"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const PendingQueueGrid: React.FC = () => {
    const { data } = useSupervisorContext();
    const queue = data.pendingQueue || [];
    const dark = useAppSelector(state => state.theme.dark);

    const mappedGridData = queue.map(pt => ({
        id: pt.id,
        patientId: pt.patientId,
        donorId: pt.donorId,
        deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
        deviceName: pt.device?.name || pt.deviceName || '-',
        locationName: pt.device?.locationName || pt.locationName || '-',
        status: pt.status,
        createdAt: pt.createdAt,
        rawPatient: pt,
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
                        Pending Supervisor Review Queue ({mappedGridData.length})
                    </Typography>
                </Box>
                {mappedGridData.length === 0 ? (
                    <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            No tests are currently waiting for supervisor review.
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
                            rowHeight={50}
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
                                <ColumnDirective headerText="Review" width="140" textAlign="Center" template={ActionTemplate} />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter, Toolbar, Search]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PendingQueueGrid;
