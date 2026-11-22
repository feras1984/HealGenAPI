import React, { useMemo, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Checkbox } from '@mui/material';
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

const CheckboxHeaderTemplate = () => {
    const {
        data,
        isAllTestsSelected,
        isSomeTestsSelected,
        toggleAllTestsSelection,
        actionLoading,
    } = useSupervisorContext();
    const allIds = (data.pendingQueue || []).map(pt => pt.id);
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
    const checked = isTestSelected(id);

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
    const {
        data,
        selectedTestIds,
        selectedTests,
        openBulkConfirmDialog,
        clearSelectedTests,
        actionLoading,
    } = useSupervisorContext();
    const { t, i18n } = useTranslation();
    const queue = data.pendingQueue || [];
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const gridRef = useRef<GridComponent | null>(null);
    const [showDelayedOnly, setShowDelayedOnly] = useState<boolean>(false);

    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || '').toLowerCase();
    const canReview = ['supervisor', 'administrator'].includes(userRole);

    const delayedCount = useMemo(
        () => queue.filter(pt => pt.delaySummary?.hasDelay).length,
        [queue]
    );
    const thresholdHours = queue[0]?.delaySummary?.thresholdHours ?? 48;

    const flaggedSelectedCount = useMemo(
        () => selectedTests.filter(test => summarizeTestResults(test.tests).hasFindings).length,
        [selectedTests]
    );

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

            return {
                id: pt.id,
                patientId: pt.patientId,
                donorId: pt.donorId,
                deviceCode: pt.device?.deviceCode || pt.deviceCode || '-',
                deviceName: pt.device?.name || pt.deviceName || '-',
                locationName: pt.device?.locationName || pt.locationName || '-',
                inspectorName: (pt.reviewedBy?.name && t(`users.${pt.reviewedBy.name}`)) || (pt.reviewedBy?.email && t(`users.${pt.reviewedBy.email}`)) || pt.reviewedBy?.name || pt.reviewedBy?.email || '-',
                resultSummary,
                resultSummaryLabel,
                delaySummary: pt.delaySummary || null,
                delayStatusLabel: getDelayStatusLabel(pt.delaySummary, t),
                status: pt.status,
                attachment: pt.attachment || null,
                capturedAt: pt.capturedAt || pt.createdAt || '-',
                receivedAt: pt.receivedAt || pt.createdAt || '-',
                inspectedAt: pt.inspectedAt || pt.inspectedBy?.at || pt.reviewedBy?.reviewedAt || '-',
                rawPatient: pt,
            };
        });
    }, [queue, showDelayedOnly, t]);

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
                <Box className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <Typography variant="h6" color="text.primary" className="font-semibold">
                        {t('supervisor.pendingQueue') || 'Pending Supervisor Review Queue'} ({mappedGridData.length})
                    </Typography>
                </Box>

                <QueueDelayBanner
                    delayedCount={delayedCount}
                    thresholdHours={thresholdHours}
                    showDelayedOnly={showDelayedOnly}
                    onToggleDelayedOnly={() => setShowDelayedOnly(prev => !prev)}
                />

                {canReview && (
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
                            {t('supervisor.noTestsWaiting') || 'No tests are currently waiting for supervisor review.'}
                        </Typography>
                    </Box>
                ) : (
                    <Box className="w-full overflow-x-auto">
                        <GridComponent
                            key={`supervisor-grid-${currentLang || i18n.language}-${isRtl ? 'rtl' : 'ltr'}-${canReview ? 'edit' : 'view'}`}
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
                            rowDataBound={(args: any) => applyDelayedRowAccent(args, isRtl, dark)}
                        >
                            <ColumnsDirective>
                                {canReview && (
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
                                <ColumnDirective field="inspectorName" headerText={t('tests.inspector') || 'Inspector'} width="160" textAlign="Center" />
                                <ColumnDirective field="status" headerText={t('common.status') || 'Status'} width="180" textAlign="Center" template={StatusTemplate} />
                                <ColumnDirective field="attachment" headerText={t('tests.attachment') || 'Attachment'} width="130" textAlign="Center" template={AttachmentTemplate} />
                                <ColumnDirective field="capturedAt" headerText={t('tests.capturedTime') || 'Captured Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="receivedAt" headerText={t('tests.receivedTime') || 'Received Time'} width="190" textAlign="Center" />
                                <ColumnDirective field="inspectedAt" headerText={t('tests.inspectedTime') || 'Inspection Time'} width="190" textAlign="Center" />
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
