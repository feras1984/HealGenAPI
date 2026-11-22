import React, { useMemo, useRef, useState } from 'react';
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
    Search,
    Selection,
    ExcelExport,
    PdfExport
} from "@syncfusion/ej2-react-grids";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import { handleGridToolbarClick } from "@/Utils/GridExportHelper";
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";
import DelayFlagChip, { applyDelayedRowAccent, getDelayStatusLabel } from "@/Components/Timeline/DelayFlagChip";
import QueueDelayBanner from "@/Components/Timeline/QueueDelayBanner";

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

const TestOperationsGrid: React.FC = () => {
    const { data } = useMonitorContext();
    const { t, i18n } = useTranslation();
    const tests = data.testOperations || [];
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
            delaySummary: pt.delaySummary || null,
            delayStatusLabel: getDelayStatusLabel(pt.delaySummary, t),
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
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #102B22)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex justify-between items-center mb-3">
                    <Typography variant="h6" sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                        {t('dashboard.recentOperations') || 'Recent Test Operations'} ({mappedGridData.length})
                    </Typography>
                </Box>
                <QueueDelayBanner
                    delayedCount={delayedCount}
                    thresholdHours={thresholdHours}
                    showDelayedOnly={showDelayedOnly}
                    onToggleDelayedOnly={() => setShowDelayedOnly(prev => !prev)}
                />
                <Box className="w-full overflow-x-auto">
                    <GridComponent
                        key={`test-ops-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}`}
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
                                fileName: isRtl ? 'العمليات_الأخيرة_للفحوصات' : 'Recent_Test_Operations',
                                title: t('dashboard.recentOperations') || 'Recent Test Operations',
                                isLandscape: true
                            })
                        }
                        pageSettings={{ pageSize: 10 }}
                        rowHeight={45}
                        rowDataBound={(args: any) => applyDelayedRowAccent(args, isRtl, dark)}
                    >
                        <ColumnsDirective>
                            <ColumnDirective field="id" headerText={t('tests.testId') || 'Id'} width="80" textAlign="Center" />
                            <ColumnDirective field="patientId" headerText={t('tests.patientCode') || 'Patient Code'} width="180" textAlign="Center" />
                            <ColumnDirective field="donorId" headerText={t('tests.donorName') || 'Donor Name'} width="200" textAlign="Center" />
                            <ColumnDirective field="delayStatusLabel" headerText={t('delay.columnHeader') || 'SLA / Delay'} width="150" textAlign="Center" template={DelayFlagTemplate} />
                            <ColumnDirective field="deviceCode" headerText={t('tests.deviceCode') || 'Device Code'} width="160" textAlign="Center" />
                            <ColumnDirective field="deviceName" headerText={t('tests.deviceName') || 'Device Name'} width="180" textAlign="Center" />
                            <ColumnDirective field="locationName" headerText={t('tests.location') || 'Location'} width="160" textAlign="Center" />
                            <ColumnDirective field="status" headerText={t('common.status') || 'Status'} width="180" textAlign="Center" template={StatusTemplate} />
                            <ColumnDirective field="capturedAt" headerText={t('tests.capturedTime') || 'Captured Time'} width="190" textAlign="Center" />
                            <ColumnDirective field="receivedAt" headerText={t('tests.receivedTime') || 'Received Time'} width="190" textAlign="Center" />
                            <ColumnDirective field="inspectedAt" headerText={t('tests.inspectedTime') || 'Inspection Time'} width="190" textAlign="Center" />
                            <ColumnDirective field="confirmedAt" headerText={t('tests.confirmedTime') || 'Confirm Time'} width="190" textAlign="Center" />
                        </ColumnsDirective>
                        <Inject services={[Page, Sort, Filter, Toolbar, Search, Selection, ExcelExport, PdfExport]} />
                    </GridComponent>
                </Box>
            </CardContent>
        </Card>
    );
};

export default TestOperationsGrid;
