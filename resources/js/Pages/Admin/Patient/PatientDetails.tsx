import React, { useState, useRef } from 'react';
import PatientHeader from "@/models/patient/PatientHeader";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import axios from 'axios';
import DocumentViewerModal from '@/Components/DocumentViewer/DocumentViewerModal';
import { DocumentItem } from '@/Components/DocumentViewer/Interfaces/DocumentViewerTypes';
import TestWorkflowTimeline from '@/Components/Timeline/TestWorkflowTimeline';
import TestHistoryTimeline from '@/Components/Timeline/TestHistoryTimeline';
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Divider,
    Paper,
    Chip,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Tooltip
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAppSelector } from "@/Redux/Store/hook";
import { exportTestDetailsToExcel, exportTestDetailsToPdf } from "@/Utils/TestDetailsExportHelper";
import { useTranslation } from "react-i18next";

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

const PatientDetails: React.FC<{ patient: PatientHeader }> = ({ patient }) => {
    const { t, i18n } = useTranslation();
    const pageProps = usePage().props as any;
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentReduxLang = useAppSelector(state => state.languages.language);
    const isRtl =
        pageProps?.lang === 'ar' ||
        direction === 'rtl' ||
        currentReduxLang === 'ar' ||
        (i18n.language && i18n.language.startsWith('ar')) ||
        (typeof window !== 'undefined' && (
            window.location.pathname.startsWith('/ar/') ||
            window.location.pathname === '/ar' ||
            document.documentElement.dir === 'rtl' ||
            document.documentElement.lang === 'ar'
        ));
    const activeLang = isRtl ? 'ar' : 'en';
    const statusColor = statusColorMap[patient.status] || 'default';

    const currentUser = pageProps?.auth?.user || pageProps?.user;
    const userRole = String(currentUser?.role || '').toLowerCase();
    const isEmployee = userRole === 'employee';

    const [attachment, setAttachment] = useState(patient.attachment || null);
    const [uploading, setUploading] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [stagedDocument, setStagedDocument] = useState<DocumentItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { snackbar, setSnackbar, handleClose: handleCloseSnackbar } = useSnackbarHook({
        open: false,
        message: '',
        severity: 'success',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const executeUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setSnackbar({
            open: true,
            message: t('tests.uploading') || 'Uploading document, please wait...',
            severity: 'info',
        });

        try {
            const res = await axios.post(`/tests/${patient.id}/file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.status) {
                setAttachment(res.data.attachment);
                setStagedDocument(null);
                setViewerOpen(false);
                setSnackbar({
                    open: true,
                    message: t('tests.uploadSuccess') || 'Test file uploaded successfully!',
                    severity: 'success',
                });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to upload test file.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            setSnackbar({
                open: true,
                message: t('tests.uploadFileTypes') || 'Please upload a PDF or Image file (.pdf, .jpg, .png, .webp).',
                severity: 'error',
            });
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: t('tests.uploadFileSizeExceeded') || 'File size must not exceed 20MB.',
                severity: 'error',
            });
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const isImage = file.type.startsWith('image/');
        setStagedDocument({
            name: file.name,
            url: objectUrl,
            isImage,
            mimeType: file.type,
            fileObject: file,
        });
        setViewerOpen(true);
        setSnackbar({
            open: true,
            message: t('tests.fileStaged') || 'Document selected. Review preview before confirming upload.',
            severity: 'info',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const requestDeleteFile = () => {
        setDeleteModalOpen(true);
    };

    const confirmDeleteFile = async () => {
        setIsDeleting(true);
        setSnackbar({
            open: true,
            message: t('tests.deleting') || 'Removing attachment...',
            severity: 'info',
        });

        try {
            const res = await axios.delete(`/tests/${patient.id}/file`);
            if (res.data.status) {
                setAttachment(null);
                setViewerOpen(false);
                setStagedDocument(null);
                setDeleteModalOpen(false);
                setSnackbar({
                    open: true,
                    message: t('tests.deleteSuccess') || 'Attachment removed successfully.',
                    severity: 'success',
                });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to remove attachment.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDeleteFile = () => {
        setDeleteModalOpen(false);
        setSnackbar({
            open: true,
            message: t('tests.removalCancelled') || 'Document removal cancelled.',
            severity: 'info',
        });
    };

    return (
        <AdminLayout>
            <Head title={`Test Details #${patient.id}`} />
            <Box
                dir={isRtl ? 'rtl' : 'ltr'}
                className="patient-details-page p-6 max-w-5xl mx-auto"
                sx={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    textAlign: isRtl ? 'right' : 'left',
                }}
            >
                {/* Navigation & Header */}
                <Box
                    className="flex flex-wrap items-center justify-between mb-6 gap-3"
                    sx={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                    <Box
                        className="flex items-center gap-3"
                        sx={{ direction: isRtl ? 'rtl' : 'ltr' }}
                    >
                        <Button
                            component={Link}
                            href={`/${activeLang}/tests`}
                            variant="outlined"
                            size="small"
                            startIcon={
                                <ArrowBackIcon
                                    sx={{
                                        transform: isRtl ? 'rotate(180deg)' : 'none',
                                        mr: isRtl ? 0 : 0.5,
                                        ml: isRtl ? 0.5 : 0,
                                    }}
                                />
                            }
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {t('common.back') || 'Back to Tests'}
                        </Button>
                        <Box sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <Typography variant="h4" color="text.primary" className="font-bold">
                                {t('common.details') || 'Test Details'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('tests.testId') || 'Test ID'} #{patient.id}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'center',
                            direction: isRtl ? 'rtl' : 'ltr',
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={
                                <TableChartIcon
                                    sx={{
                                        color: '#10b981',
                                        mr: isRtl ? 0 : 0.5,
                                        ml: isRtl ? 0.5 : 0,
                                    }}
                                />
                            }
                            onClick={() => {
                                setSnackbar({
                                    open: true,
                                    message: t('tests.exportExcelStarted') || t('common.exportExcelStarted') || 'Exporting test details to Excel...',
                                    severity: 'info',
                                });
                                exportTestDetailsToExcel(patient);
                            }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
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
                            startIcon={
                                <PictureAsPdfIcon
                                    sx={{
                                        color: '#ef4444',
                                        mr: isRtl ? 0 : 0.5,
                                        ml: isRtl ? 0.5 : 0,
                                    }}
                                />
                            }
                            onClick={() => {
                                setSnackbar({
                                    open: true,
                                    message: t('tests.exportPdfStarted') || t('common.exportPdfStarted') || 'Generating PDF summary report...',
                                    severity: 'info',
                                });
                                exportTestDetailsToPdf(patient);
                            }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
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
                    </Box>
                </Box>

                <Card
                    sx={{
                        borderRadius: 2.5,
                        backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                        direction: isRtl ? 'rtl' : 'ltr',
                        textAlign: isRtl ? 'right' : 'left',
                    }}
                >
                    <CardContent className="p-6" sx={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                        {/* Status Banner */}
                        <Paper
                            className="p-4 mb-6 flex items-center justify-between"
                            elevation={0}
                            sx={{
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                borderRadius: 2,
                                direction: isRtl ? 'rtl' : 'ltr',
                            }}
                        >
                            <Box sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textAlign: isRtl ? 'right' : 'left' }}>
                                    {t('common.status') || 'Current Status'}
                                </Typography>
                                <Chip
                                    label={t(`status.${patient.status}`) || patient.status || 'Imported'}
                                    color={statusColor}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', textAlign: isRtl ? 'left' : 'right' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textAlign: isRtl ? 'left' : 'right' }}>
                                        {t('tests.capturedTime') || 'Captured Time'}
                                    </Typography>
                                    <Typography variant="body2" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'left' : 'right' }}>
                                        {patient.capturedAt || patient.createdAt || '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textAlign: isRtl ? 'left' : 'right' }}>
                                        {t('tests.receivedTime') || 'Received Time'}
                                    </Typography>
                                    <Typography variant="body2" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'left' : 'right' }}>
                                        {patient.receivedAt || patient.createdAt || '-'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* 3-Stage Workflow Timing Timeline */}
                        <TestWorkflowTimeline patient={patient} />

                        {/* Patient & Sample Details */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            {t('tests.patientAndSampleInfo') || 'Patient & Sample Information'}
                        </Typography>
                        <Grid container spacing={3} className="mb-6" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.donorName') || 'Donor Name'}</Typography>
                                <Typography variant="body1" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.donorId || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.patientCode') || 'Patient Code'}</Typography>
                                <Typography variant="body1" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.patientId || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.collectionSite') || 'Collection Site'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.collectionSite || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.cupLotNumber') || 'Cup Lot Number'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.cupLotNumber || '-'}</Typography>
                            </Grid>
                        </Grid>

                        <Divider className="mb-6" />

                        {/* Device & Location Info */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            {t('tests.deviceAndLocationDetails') || 'Device & Location Details'}
                        </Typography>
                        <Grid container spacing={3} className="mb-6" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.deviceName') || 'Device Name'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.device?.name || (patient as any).deviceName || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.deviceCode') || 'Device Code'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.device?.deviceCode || (patient as any).deviceCode || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.deviceType') || 'Device Type'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.device?.deviceTypeName || (patient as any).deviceTypeName || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.location') || 'Location'}</Typography>
                                <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>{patient.device?.locationName || (patient as any).locationName || '-'}</Typography>
                            </Grid>
                        </Grid>

                        {/* Inspector Review Information (if present) */}
                        {(patient.inspectedBy || patient.reviewedBy) && (() => {
                            const inspectorInfo = patient.inspectedBy || patient.reviewedBy!;
                            return (
                                <>
                                    <Divider className="mb-6" />
                                    <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                        {t('tests.inspectorAttribution') || 'Inspector Review Attribution'}
                                    </Typography>
                                    <Grid container spacing={3} className="mb-6" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.inspector') || 'Inspector'}</Typography>
                                            <Typography variant="body1" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                {(inspectorInfo.name && t(`users.${inspectorInfo.name}`)) || (inspectorInfo.email && t(`users.${inspectorInfo.email}`)) || inspectorInfo.name || inspectorInfo.email || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('common.role') || 'Role'}</Typography>
                                            <Box sx={{ mt: 0.5, textAlign: isRtl ? 'right' : 'left' }}>
                                                <Chip
                                                    label={inspectorInfo.role ? (t(`roles.${inspectorInfo.role}`) || inspectorInfo.role) : '-'}
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.action') || 'Action'}</Typography>
                                            <Box sx={{ mt: 0.5, textAlign: isRtl ? 'right' : 'left' }}>
                                                <Chip
                                                    label={t(`status.${inspectorInfo.action}`) || inspectorInfo.action}
                                                    color={inspectorInfo.action === 'INSPECTOR_ACCEPT' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.inspectedTime') || 'Inspection Time'}</Typography>
                                            <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                {inspectorInfo.at || inspectorInfo.reviewedAt || '-'}
                                            </Typography>
                                        </Grid>
                                        {inspectorInfo.reason && (
                                            <Grid item xs={12} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.reason') || 'Inspector Reason / Notes'}</Typography>
                                                <Typography variant="body2" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                    {inspectorInfo.reason}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </>
                            );
                        })()}

                        {/* Expert Confirmation Information (if present) */}
                        {patient.confirmedBy && (() => {
                            const isConfirmDecision =
                                patient.confirmedBy.action === 'EXPERT_CONFIRM' ||
                                patient.confirmedBy.action === 'SUPERVISOR_CONFIRM';
                            return (
                                <>
                                    <Divider className="mb-6" />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                        <Typography variant="subtitle1" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            {t('tests.supervisorAttribution') || 'Expert Confirmation Attribution'}
                                        </Typography>
                                        {patient.isDirectExpertDecision && (
                                            <Chip
                                                label={t('supervisor.directReviewBadge') || 'Direct Expert Decision'}
                                                color="secondary"
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                    <Grid container spacing={3} className="mb-6" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.supervisor') || 'Expert'}</Typography>
                                            <Typography variant="body1" color="text.primary" className="font-semibold" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                {(patient.confirmedBy.name && t(`users.${patient.confirmedBy.name}`)) || (patient.confirmedBy.email && t(`users.${patient.confirmedBy.email}`)) || patient.confirmedBy.name || patient.confirmedBy.email || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('common.role') || 'Role'}</Typography>
                                            <Box sx={{ mt: 0.5, textAlign: isRtl ? 'right' : 'left' }}>
                                                <Chip
                                                    label={patient.confirmedBy.role ? (t(`roles.${patient.confirmedBy.role}`) || patient.confirmedBy.role) : '-'}
                                                    color="secondary"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.action') || 'Action'}</Typography>
                                            <Box sx={{ mt: 0.5, textAlign: isRtl ? 'right' : 'left' }}>
                                                <Chip
                                                    label={
                                                        isConfirmDecision
                                                            ? (t('status.Confirmed') || 'Confirmed')
                                                            : (t('status.Supervisor Rejected') || 'Expert Rejected')
                                                    }
                                                    color={isConfirmDecision ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.confirmedTime') || 'Confirm Time'}</Typography>
                                            <Typography variant="body1" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                {patient.confirmedBy.at || patient.confirmedBy.reviewedAt || '-'}
                                            </Typography>
                                        </Grid>
                                        {patient.confirmedBy.reason && (
                                            <Grid item xs={12} sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{t('tests.reason') || 'Expert Notes / Reason'}</Typography>
                                                <Typography variant="body2" color="text.primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                                    {patient.confirmedBy.reason}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </>
                            );
                        })()}

                        {/* Chronological Test History & Audit Trail */}
                        {patient.history && patient.history.length > 0 && (
                            <>
                                <Divider className="mb-6" />
                                <Box className="mb-6">
                                    <TestHistoryTimeline history={patient.history} />
                                </Box>
                            </>
                        )}

                        <Divider className="mb-6" />

                        {/* Test Document Attachment Section (PDF / Image) */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            {t('tests.testDocumentAttachment') || 'Test Document Attachment (PDF / Image)'}
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                mb: 6,
                                borderRadius: 2.5,
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                direction: isRtl ? 'rtl' : 'ltr',
                                textAlign: isRtl ? 'right' : 'left',
                            }}
                        >
                            {attachment ? (
                                <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', direction: isRtl ? 'rtl' : 'ltr' }}>
                                        <Box
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: attachment.isImage ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: attachment.isImage ? 'primary.main' : 'error.main',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {attachment.isImage ? (
                                                <ImageIcon sx={{ fontSize: 32 }} />
                                            ) : (
                                                <PictureAsPdfIcon sx={{ fontSize: 32 }} />
                                            )}
                                        </Box>

                                        <Box sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                                            <Typography variant="body1" fontWeight={700} color="text.primary">
                                                {attachment.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, direction: isRtl ? 'rtl' : 'ltr' }}>
                                                <Chip
                                                    label={attachment.isImage ? (t('tests.imageDocument') || 'Image Document') : (t('tests.pdfDocument') || 'PDF Document')}
                                                    size="small"
                                                    color={attachment.isImage ? 'primary' : 'error'}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem', height: 20 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('tests.uploaded') || 'Uploaded'}: {attachment.createdAt}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', direction: isRtl ? 'rtl' : 'ltr' }}>
                                        {/* Download button available for all roles */}
                                        <Button
                                            component="a"
                                            href={`/tests/${patient.id}/file/download`}
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={<DownloadIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                            onClick={() => {
                                                setSnackbar({
                                                    open: true,
                                                    message: t('tests.downloadStarted') || 'Starting document download...',
                                                    severity: 'info',
                                                });
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t('common.download') || 'Download'}
                                        </Button>

                                        {/* Document preview trigger (PDF or Image) */}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VisibilityIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                            onClick={() => {
                                                setStagedDocument(null);
                                                setViewerOpen(true);
                                                setSnackbar({
                                                    open: true,
                                                    message: t('tests.openingPreview') || 'Opening document preview...',
                                                    severity: 'info',
                                                });
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t('common.preview') || 'Preview'}
                                        </Button>

                                        {/* Employee-only actions: Replace & Remove */}
                                        {isEmployee && (
                                            <>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleFileChange}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                                    disabled={uploading}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {uploading ? (t('common.loading') || 'Uploading...') : (t('common.replace') || 'Replace')}
                                                </Button>

                                                <Tooltip title={t('tests.removeDocument') || "Remove attachment"}>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={requestDeleteFile}
                                                        disabled={uploading || isDeleting}
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            ) : (
                                <Box className="text-center py-4">
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {isEmployee
                                            ? (t('tests.noDocumentAttachedEmployee') || 'No document attached to this test. You can upload a medical result PDF or Image.')
                                            : (t('tests.noDocumentAttachedOther') || 'No document has been attached to this test by the employee.')}
                                    </Typography>

                                    {/* Upload button strictly for Employee role */}
                                    {isEmployee && (
                                        <>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleFileChange}
                                            />
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon sx={{ mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />}
                                                disabled={uploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 2,
                                                    px: 3,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {uploading ? (t('common.loading') || 'Uploading...') : (t('tests.uploadDocument') || 'Upload PDF / Image')}
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            )}
                        </Paper>

                        <Divider className="mb-6" />

                        {/* Medical Test Substances & Results Table */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            {t('tests.testParameters') || 'Medical Test Substances & Results (Read-Only)'}
                        </Typography>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                direction: isRtl ? 'rtl' : 'ltr',
                            }}
                        >
                            <Table size="medium">
                                <TableHead sx={{ backgroundColor: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell align={isRtl ? 'right' : 'left'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.parameter') || 'Substance'}</TableCell>
                                        <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.result') || 'Software Result'}</TableCell>
                                        <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>{t('tests.interpretation') || 'Visual Result'}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {patient.tests && patient.tests.length > 0 ? (
                                        patient.tests.map((substanceRow) => (
                                            <TableRow key={substanceRow.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell component="th" scope="row" align={isRtl ? 'right' : 'left'} sx={{ color: dark ? '#cbd5e1' : '#334155', fontWeight: 600 }}>
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
                                            <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                No substance test rows recorded for this sample.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Universal Document Viewer Modal (PDF / Image) */}
                <DocumentViewerModal
                    open={viewerOpen}
                    onClose={() => {
                        setViewerOpen(false);
                        if (stagedDocument?.fileObject) {
                            URL.revokeObjectURL(stagedDocument.url);
                            setStagedDocument(null);
                        }
                    }}
                    document={stagedDocument || attachment}
                    mode={isEmployee ? 'employee' : 'readOnly'}
                    onUpload={executeUpload}
                    onDelete={requestDeleteFile}
                    onDownload={() => {
                        setSnackbar({
                            open: true,
                            message: t('tests.downloadStarted') || 'Starting document download...',
                            severity: 'info',
                        });
                    }}
                    uploading={uploading}
                />

                {/* Document Removal Confirmation Modal */}
                <Dialog
                    open={deleteModalOpen}
                    onClose={() => !isDeleting && cancelDeleteFile()}
                    maxWidth="xs"
                    fullWidth
                    dir={isRtl ? 'rtl' : 'ltr'}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            p: 1,
                            backgroundColor: dark ? '#1e293b' : '#ffffff',
                            backgroundImage: 'none',
                            direction: isRtl ? 'rtl' : 'ltr',
                            textAlign: isRtl ? 'right' : 'left',
                        }
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                color: 'error.main',
                                flexShrink: 0,
                            }}
                        >
                            <WarningAmberIcon />
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                            {t('tests.confirmRemovalTitle') || 'Confirm Document Removal'}
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('tests.confirmRemovalDescription') || 'Are you sure you want to remove this attached file? This action cannot be undone.'}
                        </Typography>
                        {attachment && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: dark ? '#0f172a' : '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                }}
                            >
                                <DeleteOutlineIcon color="error" fontSize="small" />
                                <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>
                                    {attachment.name}
                                </Typography>
                            </Paper>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
                        <Button
                            variant="outlined"
                            onClick={cancelDeleteFile}
                            disabled={isDeleting}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            {t('tests.cancelRemoval') || t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDeleteFile}
                            disabled={isDeleting}
                            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            {isDeleting ? (t('common.loading') || 'Removing...') : (t('tests.removeDocument') || 'Remove Document')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Standard Unified CustomSnackbar */}
                <CustomSnackbar
                    open={snackbar.open}
                    message={snackbar.message}
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                />
            </Box>
        </AdminLayout>
    );
};

export default PatientDetails;
