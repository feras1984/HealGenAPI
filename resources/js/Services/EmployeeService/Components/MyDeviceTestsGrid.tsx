import React, { useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button } from '@mui/material';
import { Link } from '@inertiajs/react';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
    Search,
    ExcelExport,
    PdfExport
} from "@syncfusion/ej2-react-grids";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
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

const AttachmentTemplate = (props: any) => {
    if (props.attachment) {
        return (
            <Button
                component="a"
                href={`/tests/${props.id}/file/download`}
                variant="outlined"
                color={props.attachment.isImage ? "primary" : "error"}
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.25, fontSize: '0.75rem' }}
            >
                {props.attachment.isImage ? 'Image' : 'PDF'}
            </Button>
        );
    }

    return (
        <Button
            component={Link}
            href={`/tests/${props.id}`}
            variant="text"
            color="primary"
            size="small"
            startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', py: 0.25, fontSize: '0.75rem' }}
        >
            Upload
        </Button>
    );
};

const ActionTemplate = (props: any) => {
    return (
        <Button
            component={Link}
            href={`/tests/${props.id}`}
            variant="contained"
            color="primary"
            size="small"
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.25, fontSize: '0.75rem' }}
        >
            Details
        </Button>
    );
};

const MyDeviceTestsGrid: React.FC = () => {
    const { data } = useEmployeeContext();
    const tests = data.recentTests || [];
    const dark = useAppSelector(state => state.theme.dark);
    const gridRef = useRef<GridComponent | null>(null);

    const mappedGridData = tests.map(pt => ({
        id: pt.id,
        patientId: pt.patientId,
        donorId: pt.donorId,
        deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
        deviceName: pt.device?.name || pt.deviceName || '-',
        locationName: pt.device?.locationName || pt.locationName || '-',
        status: pt.status,
        attachment: pt.attachment,
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
                            ref={gridRef}
                            dataSource={mappedGridData}
                            allowPaging={true}
                            allowSorting={true}
                            allowFiltering={true}
                            allowExcelExport={true}
                            allowPdfExport={true}
                            toolbar={['ExcelExport', 'PdfExport', 'Search']}
                            toolbarClick={(args: ClickEventArgs) =>
                                handleGridToolbarClick(gridRef.current, args, {
                                    fileName: 'My_Assigned_Device_Tests',
                                    title: 'Tests Ingested from My Assigned Devices',
                                    isLandscape: true
                                })
                            }
                            pageSettings={{ pageSize: 10 }}
                            rowHeight={45}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="id" headerText="Id" width="70" textAlign="Center" />
                                <ColumnDirective field="patientId" headerText="Patient Code" width="160" textAlign="Center" />
                                <ColumnDirective field="donorId" headerText="Donor Name" width="180" textAlign="Center" />
                                <ColumnDirective field="deviceCode" headerText="Device Code" width="140" textAlign="Center" />
                                <ColumnDirective field="deviceName" headerText="Device Name" width="160" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText="Location" width="150" textAlign="Center" />
                                <ColumnDirective field="status" headerText="Status" width="170" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="attachment" headerText="File" width="130" textAlign="Center" template={AttachmentTemplate} />
                                <ColumnDirective field="actions" headerText="View" width="110" textAlign="Center" template={ActionTemplate} />
                                <ColumnDirective field="createdAt" headerText="Received" width="140" textAlign="Center" />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default MyDeviceTestsGrid;
