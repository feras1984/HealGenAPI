import React, { useRef } from 'react';
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
    Search,
    ExcelExport,
    PdfExport
} from "@syncfusion/ej2-react-grids";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

const ActionTemplate = (props: any) => {
    const { openTestDetails } = useSupervisorContext();
    const { t } = useTranslation();
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
            {t('supervisor.review') || 'Review'}
        </Button>
    );
};

const StatusTemplate = (props: any) => {
    const { t } = useTranslation();
    const status = props.status || 'Awaiting Supervisor';
    return (
        <Chip
            label={t(`status.${status}`) || status}
            color="secondary"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const PendingQueueGrid: React.FC = () => {
    const { data } = useSupervisorContext();
    const { t, i18n } = useTranslation();
    const queue = data.pendingQueue || [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);

    const mappedGridData = queue.map(pt => ({
        id: pt.id,
        patientId: pt.patientId,
        donorId: pt.donorId,
        deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
        deviceName: pt.device?.name || pt.deviceName || '-',
        locationName: pt.device?.locationName || pt.locationName || '-',
        inspectorName: pt.reviewedBy?.name || pt.reviewedBy?.email || '-',
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
                        {t('supervisor.pendingQueue') || 'Pending Supervisor Review Queue'} ({mappedGridData.length})
                    </Typography>
                </Box>
                {mappedGridData.length === 0 ? (
                    <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            {t('supervisor.noTestsWaiting') || 'No tests are currently waiting for supervisor review.'}
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
                            enableRtl={isRtl}
                            toolbar={['ExcelExport', 'PdfExport', 'Search']}
                            toolbarClick={(args: ClickEventArgs) =>
                                handleGridToolbarClick(gridRef.current, args, {
                                    fileName: isRtl ? 'قائمة_انتظار_مراجعة_المشرف' : 'Pending_Supervisor_Queue',
                                    title: t('supervisor.pendingQueue') || 'Pending Supervisor Review Queue',
                                    isLandscape: true
                                })
                            }
                            pageSettings={{ pageSize: 10 }}
                            rowHeight={50}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="id" headerText={t('tests.testId') || 'Id'} width="80" textAlign="Center" />
                                <ColumnDirective field="patientId" headerText={t('tests.patientCode') || 'Patient Code'} width="180" textAlign="Center" />
                                <ColumnDirective field="donorId" headerText={t('tests.donorName') || 'Donor Name'} width="200" textAlign="Center" />
                                <ColumnDirective field="deviceCode" headerText={t('tests.deviceCode') || 'Device Code'} width="160" textAlign="Center" />
                                <ColumnDirective field="deviceName" headerText={t('tests.deviceName') || 'Device Name'} width="180" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText={t('tests.location') || 'Location'} width="160" textAlign="Center" />
                                <ColumnDirective field="inspectorName" headerText={t('tests.inspector') || 'Inspector'} width="160" textAlign="Center" />
                                <ColumnDirective field="status" headerText={t('common.status') || 'Status'} width="180" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="createdAt" headerText={t('tests.receivedTime') || 'Received Time'} width="160" textAlign="Center" />
                                <ColumnDirective headerText={t('supervisor.review') || 'Review'} width="140" textAlign="Center" template={ActionTemplate} />
                            </ColumnsDirective>
                            <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
                        </GridComponent>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PendingQueueGrid;
