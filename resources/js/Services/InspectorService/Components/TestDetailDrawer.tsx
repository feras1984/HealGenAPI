import React, { useRef, useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    Grid,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DocumentViewerModal from '@/Components/DocumentViewer/DocumentViewerModal';
import DelayFlagChip from '@/Components/Timeline/DelayFlagChip';
import { useInspectorContext } from "@/Services/InspectorService/State/InspectorContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { exportTestDetailsToExcel, exportTestDetailsToPdf } from "@/Utils/TestDetailsExportHelper";
import { usePage } from '@inertiajs/react';
import { useTranslation } from "react-i18next";
import PatientHeader from '@/models/patient/PatientHeader';

const TestDetailDrawer: React.FC = () => {
    const {
        selectedTest,
        isDrawerOpen,
        closeTestDetails,
        openAcceptDialog,
        openRejectModal,
        actionLoading,
        setSnackbar,
    } = useInspectorContext();
    const [viewerOpen, setViewerOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || '').toLowerCase();
    const canInspect = ['inspector', 'expert', 'administrator'].includes(userRole);

    // Cache the last selected test so the drawer slides & fades smoothly upon closing without instant unmount
    const lastTestRef = useRef<PatientHeader | null>(null);
    if (selectedTest) {
        lastTestRef.current = selectedTest;
    }
    const activeTest = selectedTest || lastTestRef.current;

    if (!activeTest && !isDrawerOpen) return null;
    if (!activeTest) return null;

    return (
        <>
        <Drawer
            anchor="right"
            open={isDrawerOpen && !!activeTest}
            onClose={closeTestDetails}
            transitionDuration={{ enter: 300, exit: 300 }}
            SlideProps={{
                appear: true,
                timeout: { enter: 300, exit: 300 },
            }}
            PaperProps={{
                dir: isRtl ? 'rtl' : 'ltr',
                className: 'test-detail-drawer',
                sx: {
                    width: { xs: '100%', sm: '92vw', md: 920, lg: 1080 },
                    maxWidth: '96vw',
                    backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                    color: dark ? 'var(--clr-text-light, #fafafa)' : 'var(--clr-text-dark, #374151)',
                    p: { xs: 2, sm: 3 },
                    direction: isRtl ? 'rtl' : 'ltr',
                    textAlign: isRtl ? 'right' : 'left',
                }
            }}
        >
            {activeTest && (
                <>
                    {/* Header: Title, Test ID, Close Button & Quick Export Actions */}
                    <Box className="flex flex-wrap justify-between items-center mb-3 gap-2" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                        <Box sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <Typography variant="h5" color="text.primary" className="font-bold">
                                {t('inspector.queueTitle') || 'Test Inspection'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('tests.testId') || 'Test ID'} #{activeTest.id}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<TableChartIcon sx={{ color: '#10b981', fontSize: 16, mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                onClick={() => exportTestDetailsToExcel(activeTest)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 1.5,
                                    fontSize: '0.75rem',
                                    py: 0.3,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    whiteSpace: 'nowrap',
                                    borderColor: dark ? '#475569' : '#cbd5e1',
                                    color: dark ? '#f8fafc' : '#0f172a',
                                    backgroundColor: dark ? '#1e293b' : '#ffffff',
                                    '&:hover': {
                                        borderColor: '#10b981',
                                        backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                    }
                                }}
                            >
                                {t('common.exportExcel') || 'Export Excel'}
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 16, mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                onClick={() => exportTestDetailsToPdf(activeTest)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 1.5,
                                    fontSize: '0.75rem',
                                    py: 0.3,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    whiteSpace: 'nowrap',
                                    borderColor: dark ? '#475569' : '#cbd5e1',
                                    color: dark ? '#f8fafc' : '#0f172a',
                                    backgroundColor: dark ? '#1e293b' : '#ffffff',
                                    '&:hover': {
                                        borderColor: '#ef4444',
                                        backgroundColor: dark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                    }
                                }}
                            >
                                {t('common.exportPdf') || 'Export PDF'}
                            </Button>
                            <IconButton onClick={closeTestDetails} color="inherit" size="small">
                                <CloseIcon />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Action Bar (Current Status & Decision Buttons) */}
                    <Paper
                        className="p-3 mb-4 flex flex-wrap items-center justify-between gap-3"
                        elevation={0}
                        sx={{
                            direction: isRtl ? 'rtl' : 'ltr',
                            textAlign: isRtl ? 'right' : 'left',
                            backgroundColor: dark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                            border: '1px solid',
                            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <Typography variant="caption" color="text.secondary" className="block">
                                {t('common.status') || 'Current Status'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.25 }}>
                                <Chip label={t(`status.${activeTest.status}`) || activeTest.status || 'Imported'} color="warning" size="small" sx={{ fontWeight: 600 }} />
                                <DelayFlagChip delaySummary={activeTest.delaySummary} hideWhenOnTime />
                            </Box>
                        </Box>
                        <Box className="flex gap-2" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                            {canInspect ? (
                                <>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<SendIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                        onClick={openAcceptDialog}
                                        disabled={actionLoading}
                                        sx={{ textTransform: 'none', fontWeight: 600, mx: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
                                    >
                                        {t('inspector.forwardTest') || 'Forward'}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<ReplayIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                        onClick={openRejectModal}
                                        disabled={actionLoading}
                                        sx={{ textTransform: 'none', fontWeight: 600, mx: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
                                    >
                                        {t('inspector.retestTest') || 'Retest'}
                                    </Button>
                                </>
                            ) : (
                                <Tooltip title={t('inspector.viewOnlyTooltip') || "View Only: Only Inspectors can process test decisions."}>
                                    <span>
                                        <Chip
                                            label={t('inspector.viewOnlyMode') || "View Only Mode"}
                                            color="default"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                    </Paper>

                    <Divider className="mb-4" />

                    {/* Side-by-Side 2-Column Layout: Text Information & PDF (Column 1) next to Test Details & Substance Results (Column 2) */}
                    <Grid container spacing={2.5} sx={{ direction: isRtl ? 'rtl' : 'ltr', alignItems: 'stretch' }}>
                        {/* Column 1: Text Information, Patient, Device & Document / PDF */}
                        <Grid item xs={12} md={6}>
                            <Stack spacing={2.5}>
                                {/* Patient & Sample Details */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        textAlign: isRtl ? 'right' : 'left',
                                        backgroundColor: dark ? 'rgba(15, 23, 42, 0.3)' : '#f8fafc',
                                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                        {t('tests.patientAndSampleInfo') || 'Patient & Sample Information'}
                                    </Typography>
                                    <Grid container spacing={1.5} sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.donorName') || 'Donor Name'}</Typography>
                                            <Typography variant="body2" color="text.primary" className="font-semibold">{activeTest.donorId || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.patientCode') || 'Patient Code'}</Typography>
                                            <Typography variant="body2" color="text.primary" className="font-semibold">{activeTest.patientId || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.collectionSite') || 'Collection Site'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.collectionSite || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.cupLotNumber') || 'Cup Lot Number'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.cupLotNumber || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.capturedTime') || 'Captured Time'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.capturedAt || activeTest.createdAt || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.receivedTime') || 'Received Time'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.receivedAt || activeTest.createdAt || '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Device & Location Info */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        textAlign: isRtl ? 'right' : 'left',
                                        backgroundColor: dark ? 'rgba(15, 23, 42, 0.3)' : '#f8fafc',
                                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                        {t('tests.deviceAndLocationDetails') || 'Device & Location Details'}
                                    </Typography>
                                    <Grid container spacing={1.5} sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.deviceName') || 'Device Name'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.device?.name || activeTest.deviceName || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.deviceCode') || 'Device Code'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.device?.deviceCode || activeTest.deviceCode || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.deviceType') || 'Device Type'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.device?.deviceTypeName || activeTest.deviceTypeName || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary">{t('tests.location') || 'Location'}</Typography>
                                            <Typography variant="body2" color="text.primary">{activeTest.device?.locationName || activeTest.locationName || '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Attached Document Section (PDF / Image) */}
                                {activeTest.attachment && (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            textAlign: isRtl ? 'right' : 'left',
                                            backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                                            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            {t('tests.testDocumentAttachment') || 'Attached Test Document (PDF / Image)'}
                                        </Typography>

                                        <Box className="flex flex-col gap-2">
                                            <Box className="flex items-center gap-3" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                                {activeTest.attachment.isImage ? (
                                                    <ImageIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                                                ) : (
                                                    <PictureAsPdfIcon sx={{ color: 'error.main', fontSize: 32 }} />
                                                )}
                                                <Box sx={{ mx: 1, textAlign: isRtl ? 'right' : 'left' }}>
                                                    <Typography variant="body2" className="font-semibold" color="text.primary">
                                                        {activeTest.attachment.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, direction: isRtl ? 'rtl' : 'ltr' }}>
                                                        <Chip
                                                            label={activeTest.attachment.isImage ? (t('tests.imageDocument') || 'Image Document') : (t('tests.pdfDocument') || 'PDF Document')}
                                                            size="small"
                                                            color={activeTest.attachment.isImage ? 'primary' : 'error'}
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {activeTest.attachment.createdAt}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 1, mt: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
                                                <Button
                                                    component="a"
                                                    href={activeTest.attachment.downloadUrl || `/tests/${activeTest.id}/file/download`}
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<DownloadIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                                    onClick={() => {
                                                        if (setSnackbar) {
                                                            setSnackbar({
                                                                open: true,
                                                                message: t('tests.downloadStarted') || 'Starting document download...',
                                                                severity: 'info',
                                                            });
                                                        }
                                                    }}
                                                    sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
                                                >
                                                    {t('common.download') || 'Download'}
                                                </Button>
                                                {activeTest.attachment.url && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                                        onClick={() => {
                                                            setViewerOpen(true);
                                                            if (setSnackbar) {
                                                                setSnackbar({
                                                                    open: true,
                                                                    message: t('tests.openingPreview') || 'Opening document preview...',
                                                                    severity: 'info',
                                                                });
                                                            }
                                                        }}
                                                        sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
                                                    >
                                                        {t('common.preview') || 'Preview'}
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                )}
                            </Stack>
                        </Grid>

                        {/* Column 2: Test Details (Test Substances & Qualitative Results Table) - Placed next to the text info */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    height: '100%',
                                    textAlign: isRtl ? 'right' : 'left',
                                    backgroundColor: dark ? 'rgba(15, 23, 42, 0.3)' : '#ffffff',
                                    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                                }}
                            >
                                <Box className="flex justify-between items-center mb-2" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                    <Typography variant="subtitle2" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                        {t('tests.testParameters') || 'Test Substances & Qualitative Results'}
                                    </Typography>
                                    <Chip
                                        label={`${activeTest.tests?.length || 0} ${t('tests.substances') || 'Substances'}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                    />
                                </Box>

                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 1.5,
                                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                        maxHeight: 520,
                                        overflowY: 'auto',
                                        direction: isRtl ? 'rtl' : 'ltr',
                                    }}
                                >
                                    <Table size="small" stickyHeader>
                                        <TableHead sx={{ backgroundColor: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell align={isRtl ? 'right' : 'left'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.parameter') || 'Substance'}</TableCell>
                                                <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.result') || 'Software'}</TableCell>
                                                <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.interpretation') || 'Visual'}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {activeTest.tests && activeTest.tests.length > 0 ? (
                                                activeTest.tests.map((substanceRow) => (
                                                    <TableRow key={substanceRow.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell component="th" scope="row" align={isRtl ? 'right' : 'left'} sx={{ color: dark ? '#cbd5e1' : '#334155', fontWeight: 500 }}>
                                                            {substanceRow.substance}
                                                        </TableCell>
                                                        <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#1e293b' }}>
                                                            {substanceRow.softwareResult || '-'}
                                                        </TableCell>
                                                        <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#1e293b' }}>
                                                            {substanceRow.visualResult || '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                                        No substance test rows found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Drawer>

        {/* Universal Document Viewer Modal for Inspector */}
        {activeTest?.attachment && (
            <DocumentViewerModal
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                document={activeTest.attachment}
                mode="inspector"
                onDownload={() => {
                    if (setSnackbar) {
                        setSnackbar({
                            open: true,
                            message: t('tests.downloadStarted') || 'Starting document download...',
                            severity: 'info',
                        });
                    }
                }}
            />
        )}
        </>
    );
};

export default TestDetailDrawer;
