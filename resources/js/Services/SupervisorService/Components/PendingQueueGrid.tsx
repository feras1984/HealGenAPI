import React, { useMemo, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Checkbox, Tabs, Tab, Stack } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
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
import { usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { summarizeTestResults, TestResultSummary } from "@/Utils/TestResultSummaryHelper";
import ResultSummaryChip from "@/Components/BulkAction/ResultSummaryChip";
import BulkSelectionBar from "@/Components/BulkAction/BulkSelectionBar";
import DelayFlagChip, { applyDelayedRowAccent, getDelayStatusLabel } from "@/Components/Timeline/DelayFlagChip";
import QueueDelayBanner from "@/Components/Timeline/QueueDelayBanner";
import { ExpertQueueSource, ExpertQueueView } from "@/models/supervisor/SupervisorData";

const statusColorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    'Imported': 'info',
    'Awaiting Inspection': 'warning',
    'Inspector Accepted': 'primary',
    'Inspector Rejected': 'error',
    'Awaiting Supervisor': 'secondary',
    'Confirmed': 'success',
    'Supervisor Rejected': 'error',
    'Failed': 'error',
    'Blocked': 'error',
    'SentToHIS': 'success',
    'FailedToSend': 'error',
};

const CheckboxHeaderTemplate = () => {
    const {
        data,
        isAllTestsSelected,
        isSomeTestsSelected,
        toggleAllTestsSelection,
        actionLoading,
    } = useSupervisorContext();
    const tests = data.tests ?? data.pendingQueue ?? [];
    const allIds = tests.filter(pt => pt.canExpertDecide !== false).map(pt => pt.id);
    const checked = isAllTestsSelected(allIds);
    const indeterminate = isSomeTestsSelected(allIds);

    return (
        <Checkbox
            size="small"
            checked={checked}
            indeterminate={indeterminate}
            disabled={actionLoading || allIds.length === 0}
            onChange={() => toggleAllTestsSelection(allIds)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ 'aria-label': 'Select all pending tests' }}
            sx={{ p: 0.5 }}
        />
    );
};

const CheckboxCellTemplate = (props: any) => {
    const { isTestSelected, toggleTestSelection, actionLoading } = useSupervisorContext();
    const id = Number(props.id ?? props.rawPatient?.id);
    const canDecide = props.rawPatient?.canExpertDecide !== false;
    const checked = isTestSelected(id);

    if (!canDecide) {
        return null;
    }

    return (
        <Checkbox
            size="small"
            checked={checked}
            disabled={actionLoading}
            onChange={() => toggleTestSelection(id)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ 'aria-label': `Select test #${id}` }}
            sx={{ p: 0.5 }}
        />
    );
};

const ResultSummaryTemplate = (props: any) => {
    const { openTestDetails } = useSupervisorContext();
    const summary: TestResultSummary = props.resultSummary || summarizeTestResults(props.rawPatient?.tests);

    return (
        <ResultSummaryChip
            summary={summary}
            onClick={(e) => {
                e.stopPropagation();
                openTestDetails(props.rawPatient);
            }}
        />
    );
};

const DelayFlagTemplate = (props: any) => {
    const { openTestDetails } = useSupervisorContext();
    return (
        <DelayFlagChip
            delaySummary={props.delaySummary || props.rawPatient?.delaySummary}
            onClick={(e) => {
                e.stopPropagation();
                openTestDetails(props.rawPatient);
            }}
        />
    );
};

const ActionTemplate = (props: any) => {
    const { openTestDetails } = useSupervisorContext();
    const { t } = useTranslation();
    const rowData = props;
    const canDecide = rowData.rawPatient?.canExpertDecide !== false;
    return (
        <Button
            variant={canDecide ? "contained" : "outlined"}
            color="primary"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => openTestDetails(rowData.rawPatient)}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
        >
            {canDecide ? (t('supervisor.review') || 'Review') : (t('supervisor.viewDetails') || 'View')}
        </Button>
    );
};

const AttachmentTemplate = (props: any) => {
    const { t } = useTranslation();
    const attachment = props.attachment || props.rawPatient?.attachment;
    const { openTestDetails } = useSupervisorContext();

    if (!attachment) {
        return <Typography variant="caption" color="text.secondary">-</Typography>;
    }

    return (
        <Chip
            size="small"
            icon={attachment.isImage ? <ImageIcon sx={{ fontSize: '14px !important' }} /> : <PictureAsPdfIcon sx={{ fontSize: '14px !important' }} />}
            label={attachment.isImage ? (t('tests.imageDocument') || 'Image') : (t('tests.pdfDocument') || 'PDF')}
            color={attachment.isImage ? 'primary' : 'error'}
            variant="outlined"
            clickable
            onClick={(e) => {
                e.stopPropagation();
                openTestDetails(props.rawPatient);
            }}
            sx={{ fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}
        />
    );
};

const InspectorColumnTemplate = (props: any) => {
    const { t } = useTranslation();
    const reviewedBy = props.rawPatient?.inspectedBy || props.rawPatient?.reviewedBy;

    if (!reviewedBy) {
        return (
            <Chip
                label={t('supervisor.notInspected') || 'Direct'}
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
        );
    }

    return (
        <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem' }}>
            {props.inspectorName}
        </Typography>
    );
};

const StatusTemplate = (props: any) => {
    const { t } = useTranslation();
    const status = props.status || 'Imported';
    const color = statusColorMap[status] || 'default';
    return (
        <Chip
            label={t(`status.${status}`) || status}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const PendingQueueGrid: React.FC = () => {
    const {
        data,
        filters,
        updateFilter,
        selectedTestIds,
        selectedTests,
        openBulkConfirmDialog,
        clearSelectedTests,
        actionLoading,
    } = useSupervisorContext();
    const { t, i18n } = useTranslation();
    const activeView: ExpertQueueView = (filters.view || data.activeView || 'pending') as ExpertQueueView;
    const activeSource: ExpertQueueSource = (filters.source || 'all') as ExpertQueueSource;
    const queue = data.tests ?? data.pendingQueue ?? [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);
    const [showDelayedOnly, setShowDelayedOnly] = useState<boolean>(false);

    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || '').toLowerCase();
    const canReview = ['expert', 'administrator'].includes(userRole);
    const showBulkSelection = canReview && activeView === 'pending';

    const delayedCount = useMemo(
        () => queue.filter(pt => pt.delaySummary?.hasDelay).length,
        [queue]
    );
    const thresholdHours = queue[0]?.delaySummary?.thresholdHours ?? 48;

    const flaggedSelectedCount = useMemo(
        () => selectedTests.filter(test => summarizeTestResults(test.tests).hasFindings).length,
        [selectedTests]
    );

    const viewMeta = useMemo(() => {
        switch (activeView) {
            case 'confirmed':
                return {
                    title: t('supervisor.confirmedListTitle') || 'Confirmed Tests',
                    emptyMessage: t('supervisor.noTestsConfirmed') || 'No confirmed tests match the selected filters.',
                    exportName: isRtl ? 'الفحوصات_المعتمدة' : 'Expert_Confirmed_Tests',
                };
            case 'rejected':
                return {
                    title: t('supervisor.rejectedListTitle') || 'Rejected Tests',
                    emptyMessage: t('supervisor.noTestsRejected') || 'No rejected tests match the selected filters.',
                    exportName: isRtl ? 'الفحوصات_المرفوضة' : 'Expert_Rejected_Tests',
                };
            case 'all':
                return {
                    title: t('supervisor.allListTitle') || 'All Expert-Managed Tests',
                    emptyMessage: t('supervisor.noTestsAll') || 'No tests match the selected filters.',
                    exportName: isRtl ? 'جميع_فحوصات_الخبير' : 'All_Expert_Tests',
                };
            default:
                return {
                    title: t('supervisor.pendingQueue') || 'Pending Expert Review Queue',
                    emptyMessage: t('supervisor.noTestsWaiting') || 'No tests are currently waiting for expert review.',
                    exportName: isRtl ? 'قائمة_انتظار_مراجعة_الخبير' : 'Pending_Expert_Queue',
                };
        }
    }, [activeView, isRtl, t]);

    const mappedGridData = useMemo(() => {
        const filteredQueue = showDelayedOnly ? queue.filter(pt => pt.delaySummary?.hasDelay) : queue;
        return filteredQueue.map(pt => {
            const resultSummary = summarizeTestResults(pt.tests);
            let resultSummaryLabel = t('tests.noResults') || 'No Results';
            if (resultSummary.status === 'positive') {
                resultSummaryLabel = t('tests.positiveCount', { count: resultSummary.positiveCount }) || `${resultSummary.positiveCount} Positive`;
            } else if (resultSummary.status === 'abnormal') {
                resultSummaryLabel = t('tests.abnormalCount', { count: resultSummary.abnormalCount }) || `${resultSummary.abnormalCount} Abnormal`;
            } else if (resultSummary.status === 'all_negative') {
                resultSummaryLabel = t('tests.allNegative') || 'All Negative';
            }

            const insp = pt.inspectedBy || pt.reviewedBy;
            const inspectorName = insp
                ? ((insp.name && t(`users.${insp.name}`)) || (insp.email && t(`users.${insp.email}`)) || insp.name || insp.email || '-')
                : (t('supervisor.notInspected') || 'Direct');

            return {
                id: pt.id,
                patientId: pt.patientId,
                donorId: pt.donorId,
                deviceCode: pt.device?.deviceCode || (pt as any).deviceCode || '-',
                deviceName: pt.device?.name || (pt as any).deviceName || '-',
                locationName: pt.device?.locationName || (pt as any).locationName || '-',
                inspectorName,
                resultSummary,
                resultSummaryLabel,
                delaySummary: pt.delaySummary || null,
                delayStatusLabel: getDelayStatusLabel(pt.delaySummary, t),
                status: pt.status,
                attachment: pt.attachment || null,
                capturedAt: pt.capturedAt || pt.createdAt || '-',
                receivedAt: pt.receivedAt || pt.createdAt || '-',
                inspectedAt: pt.inspectedAt || pt.inspectedBy?.at || pt.reviewedBy?.reviewedAt || '-',
                confirmedAt: pt.confirmedAt || pt.confirmedBy?.at || '-',
                rawPatient: pt,
            };
        });
    }, [queue, showDelayedOnly, t]);

    const handleViewTabChange = (_event: React.SyntheticEvent, newValue: ExpertQueueView) => {
        setShowDelayedOnly(false);
        updateFilter('view', newValue);
    };

    const handleSourceChange = (source: ExpertQueueSource) => {
        updateFilter('source', source);
    };

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
                {/* Expert Workflow View Tabs (Pending / Confirmed / Rejected / All) */}
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: dark ? 'rgba(255,255,255,0.12)' : 'divider',
                        mb: 2.5,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                    }}
                >
                    <Tabs
                        value={activeView}
                        onChange={handleViewTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab
                            value="pending"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{t('supervisor.pendingTab') || 'Pending Review'}</span>
                                    <Chip size="small" label={data.kpis?.pendingCount ?? 0} color="warning" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
                                </Box>
                            }
                        />
                        <Tab
                            value="confirmed"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{t('supervisor.confirmedTab') || 'Confirmed'}</span>
                                    <Chip size="small" label={data.kpis?.totalConfirmedCount ?? 0} color="success" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
                                </Box>
                            }
                        />
                        <Tab
                            value="rejected"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{t('supervisor.rejectedTab') || 'Rejected'}</span>
                                    <Chip size="small" label={data.kpis?.totalRejectedCount ?? 0} color="error" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
                                </Box>
                            }
                        />
                        <Tab
                            value="all"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                            label={t('supervisor.allTab') || 'All Tests'}
                        />
                    </Tabs>

                    {/* Pending Source Sub-filter Chips */}
                    {activeView === 'pending' && (
                        <Stack direction="row" spacing={1} sx={{ pb: { xs: 1.5, md: 0.5 }, flexWrap: 'wrap', gap: 0.75 }}>
                            <Chip
                                size="small"
                                label={`${t('supervisor.sourceAll') || 'All Pending'} (${data.kpis?.pendingCount ?? 0})`}
                                color={activeSource === 'all' ? 'primary' : 'default'}
                                variant={activeSource === 'all' ? 'filled' : 'outlined'}
                                clickable
                                onClick={() => handleSourceChange('all')}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip
                                size="small"
                                label={`${t('supervisor.sourceDirect') || 'Direct from Employee'} (${data.kpis?.directPendingCount ?? 0})`}
                                color={activeSource === 'direct' ? 'info' : 'default'}
                                variant={activeSource === 'direct' ? 'filled' : 'outlined'}
                                clickable
                                onClick={() => handleSourceChange('direct')}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip
                                size="small"
                                label={`${t('supervisor.sourceInspected') || 'Inspector Forwarded'} (${data.kpis?.inspectorForwardedPendingCount ?? 0})`}
                                color={activeSource === 'inspected' ? 'secondary' : 'default'}
                                variant={activeSource === 'inspected' ? 'filled' : 'outlined'}
                                clickable
                                onClick={() => handleSourceChange('inspected')}
                                sx={{ fontWeight: 600 }}
                            />
                        </Stack>
                    )}
                </Box>

                <Box className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <Typography variant="h6" color="text.primary" className="font-semibold">
                        {viewMeta.title} ({mappedGridData.length})
                    </Typography>
                </Box>

                <QueueDelayBanner
                    delayedCount={delayedCount}
                    thresholdHours={thresholdHours}
                    showDelayedOnly={showDelayedOnly}
                    onToggleDelayedOnly={() => setShowDelayedOnly(prev => !prev)}
                />

                {showBulkSelection && (
                    <BulkSelectionBar
                        selectedCount={selectedTestIds.length}
                        flaggedCount={flaggedSelectedCount}
                        primaryLabel={
                            t('bulk.confirmSelected', { count: selectedTestIds.length }) ||
                            `Confirm Selected (${selectedTestIds.length})`
                        }
                        primaryColor="success"
                        onPrimaryAction={openBulkConfirmDialog}
                        onClearSelection={clearSelectedTests}
                        disabled={actionLoading}
                    />
                )}

                {mappedGridData.length === 0 ? (
                    <Box className="p-8 text-center border rounded-lg" sx={{ backgroundColor: dark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <Typography color="text.secondary">
                            {viewMeta.emptyMessage}
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            key={`supervisor-grid-${activeView}-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}-${showBulkSelection ? 'edit' : 'view'}`}
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
                                    fileName: viewMeta.exportName,
                                    title: viewMeta.title,
                                    isLandscape: true
                                })
                            }
                            pageSettings={{ pageSize: 10 }}
                            rowHeight={50}
                            rowDataBound={(args: any) => applyDelayedRowAccent(args, isRtl, dark)}
                        >
                            <ColumnsDirective>
                                {showBulkSelection && (
                                    <ColumnDirective
                                        field="bulkSelect"
                                        width="60"
                                        textAlign="Center"
                                        allowSorting={false}
                                        allowFiltering={false}
                                        allowSearching={false}
                                        headerTemplate={CheckboxHeaderTemplate}
                                        template={CheckboxCellTemplate}
                                    />
                                )}
                                <ColumnDirective field="id" headerText={t('tests.testId') || 'Id'} width="80" textAlign="Center" />
                                <ColumnDirective field="patientId" headerText={t('tests.patientCode') || 'Patient Code'} width="180" textAlign="Center" />
                                <ColumnDirective field="donorId" headerText={t('tests.donorName') || 'Donor Name'} width="200" textAlign="Center" />
                                <ColumnDirective field="resultSummaryLabel" headerText={t('tests.resultSummary') || 'Result Summary'} width="160" textAlign="Center" template={ResultSummaryTemplate} />
                                <ColumnDirective field="delayStatusLabel" headerText={t('delay.columnHeader') || 'SLA / Delay'} width="150" textAlign="Center" template={DelayFlagTemplate} />
                                <ColumnDirective field="deviceCode" headerText={t('tests.deviceCode') || 'Device Code'} width="160" textAlign="Center" />
                                <ColumnDirective field="deviceName" headerText={t('tests.deviceName') || 'Device Name'} width="180" textAlign="Center" />
                                <ColumnDirective field="locationName" headerText={t('tests.location') || 'Location'} width="160" textAlign="Center" />
                                <ColumnDirective field="inspectorName" headerText={t('tests.inspector') || 'Inspector'} width="150" textAlign="Center" template={InspectorColumnTemplate} />
                                <ColumnDirective field="status" headerText={t('common.status') || 'Status'} width="180" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="attachment" headerText={t('tests.attachment') || 'Attachment'} width="130" textAlign="Center" template={AttachmentTemplate} />
                                <ColumnDirective field="capturedAt" headerText={t('tests.capturedTime') || 'Captured Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="receivedAt" headerText={t('tests.receivedTime') || 'Received Time'} width="190" textAlign="Center" />
                                {activeView === 'pending' ? (
                                    <ColumnDirective field="inspectedAt" headerText={t('tests.inspectedTime') || 'Inspection Time'} width="190" textAlign="Center" />
                                ) : (
                                    <ColumnDirective field="confirmedAt" headerText={t('tests.confirmedTime') || 'Decision Time'} width="190" textAlign="Center" />
                                )}
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
