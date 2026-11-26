import React, { useMemo, useRef, useState } from 'react';
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
import { useTranslation } from "react-i18next";
import DelayFlagChip, { applyDelayedRowAccent, getDelayStatusLabel } from "@/Components/Timeline/DelayFlagChip";
import QueueDelayBanner from "@/Components/Timeline/QueueDelayBanner";
import { isPdfIngestedTest } from "@/Utils/IngestionSourceHelper";

const DelayFlagTemplate = (props: any) => (
    <DelayFlagChip delaySummary={props.delaySummary} />
);

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
    const { t } = useTranslation();
    const status = props.status || 'Imported';
    const color = statusColorMap[status] || 'default';
    const translatedStatus = t(`status.${status}`) || status;

    return (
        <Chip
            label={translatedStatus}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const AttachmentTemplate = (props: any) => {
    const { t, i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
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

    if (isPdfIngestedTest(props) || props.canManageAttachment === false) {
        return (
            <Chip
                label={t('tests.pdfIngestionSource') || 'Direct PDF'}
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.72rem', fontWeight: 600 }}
            />
        );
    }

    return (
        <Button
            component={Link}
            href={`/${activeLang}/tests/${props.id}`}
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.25, fontSize: '0.75rem' }}
        >
            {t('common.upload') || 'Upload'}
        </Button>
    );
};

const ActionTemplate = (props: any) => {
    const { t, i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    return (
        <Button
            component={Link}
            href={`/${activeLang}/tests/${props.id}`}
            variant="contained"
            color="primary"
            size="small"
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.25, fontSize: '0.75rem' }}
        >
            {t('common.details') || 'Details'}
        </Button>
    );
};

const MyDeviceTestsGrid: React.FC = () => {
    const { data } = useEmployeeContext();
    const { t, i18n } = useTranslation();
    const tests = data.recentTests || [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);
    const [showDelayedOnly, setShowDelayedOnly] = useState<boolean>(false);

    const delayedCount = useMemo(
        () => tests.filter(pt => pt.delaySummary?.hasDelay).length,
        [tests]
    );
    const thresholdHours = tests[0]?.delaySummary?.thresholdHours ?? 48;

    const mappedGridData = useMemo(() => {
        const filteredTests = showDelayedOnly ? tests.filter(pt => pt.delaySummary?.hasDelay) : tests;
        return filteredTests.map(pt => ({
            id: pt.id,
            patientId: pt.patientId,
            donorId: pt.donorId,
            deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
            deviceName: pt.device?.name || pt.deviceName || '-',
            locationName: pt.device?.locationName || pt.locationName || '-',
            status: pt.status,
            ingestionSource: pt.ingestionSource || 'excel',
            canManageAttachment: pt.canManageAttachment ?? pt.ingestionSource !== 'pdf',
            delaySummary: pt.delaySummary || null,
            delayStatusLabel: getDelayStatusLabel(pt.delaySummary, t),
            attachment: pt.attachment,
            capturedAt: pt.capturedAt || pt.createdAt || '-',
            receivedAt: pt.receivedAt || pt.createdAt || '-',
            inspectedAt: pt.inspectedAt || pt.inspectedBy?.at || pt.reviewedBy?.reviewedAt || '-',
            confirmedAt: pt.confirmedAt || pt.confirmedBy?.at || '-',
        }));
    }, [tests, showDelayedOnly, t]);

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
                        {t('employee.testsFromMyDevices') || 'Tests Ingested from My Assigned Devices'} ({mappedGridData.length})
                    </Typography>
                </Box>

                <QueueDelayBanner
                    delayedCount={delayedCount}
                    thresholdHours={thresholdHours}
                    showDelayedOnly={showDelayedOnly}
                    onToggleDelayedOnly={() => setShowDelayedOnly(prev => !prev)}
                />
                {mappedGridData.length === 0 ? (
                    <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            {t('employee.noTestsRecorded') || 'No test results recorded for your assigned devices yet.'}
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            key={`my-device-tests-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
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
                                    fileName: isRtl ? 'فحوصات_أجهزتي_المعينة' : 'My_Assigned_Device_Tests',
                                    title: t('employee.testsFromMyDevices') || 'Tests Ingested from My Assigned Devices',
                                    isLandscape: true
                                })
                            }
                            pageSettings={{ pageSize: 10 }}
                            rowHeight={45}
                            rowDataBound={(args: any) => applyDelayedRowAccent(args, isRtl, dark)}
                        >
                            <ColumnsDirective>
                                <ColumnDirective field="id" headerText={t('tests.testId') || 'Id'} width="70" textAlign="Center" />
                                <ColumnDirective field="patientId" headerText={t('tests.patientCode') || 'Patient Code'} width="160" textAlign="Center" />
                                <ColumnDirective field="donorId" headerText={t('tests.donorName') || 'Donor Name'} width="180" textAlign="Center" />
                                <ColumnDirective field="delayStatusLabel" headerText={t('delay.columnHeader') || 'SLA / Delay'} width="150" textAlign="Center" template={DelayFlagTemplate} />
                                <ColumnDirective field="deviceCode" headerText={t('tests.deviceCode') || 'Device Code'} width="140" textAlign="Center" />
                                <ColumnDirective field="deviceName" headerText={t('tests.deviceName') || 'Device Name'} width="160" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText={t('tests.location') || 'Location'} width="150" textAlign="Center" />
                                <ColumnDirective field="status" headerText={t('common.status') || 'Status'} width="170" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="attachment" headerText={t('tests.attachment') || 'Attachment'} width="130" textAlign="Center" template={AttachmentTemplate} />
                                <ColumnDirective field="capturedAt" headerText={t('tests.capturedTime') || 'Captured Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="receivedAt" headerText={t('tests.receivedTime') || 'Received Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="inspectedAt" headerText={t('tests.inspectedTime') || 'Inspection Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="confirmedAt" headerText={t('tests.confirmedTime') || 'Confirm Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="actions" headerText={t('common.details') || 'View'} width="130" textAlign="Center" template={ActionTemplate} />
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
