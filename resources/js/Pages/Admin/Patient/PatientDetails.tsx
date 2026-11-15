import React, { useState, useRef } from 'react';
import PatientHeader from "@/models/patient/PatientHeader";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import axios from 'axios';
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
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
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
import { useAppSelector } from "@/Redux/Store/hook";
import { exportTestDetailsToExcel, exportTestDetailsToPdf } from "@/Utils/TestDetailsExportHelper";

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
    const dark = useAppSelector(state => state.theme.dark);
    const statusColor = statusColorMap[patient.status] || 'default';

    const pageProps = usePage().props as any;
    const currentUser = pageProps?.auth?.user || pageProps?.user;
    const userRole = String(currentUser?.role || '').toLowerCase();
    const isEmployee = userRole === 'employee';

    const [attachment, setAttachment] = useState(patient.attachment || null);
    const [uploading, setUploading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            setSnackbar({ open: true, message: 'Please upload a PDF or Image file (.pdf, .jpg, .png, .webp).', severity: 'error' });
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'File size must not exceed 20MB.', severity: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`/tests/${patient.id}/file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.status) {
                setAttachment(res.data.attachment);
                setSnackbar({ open: true, message: 'Test file uploaded successfully!', severity: 'success' });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to upload test file.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async () => {
        if (!window.confirm('Are you sure you want to remove this attached file?')) return;
        try {
            const res = await axios.delete(`/tests/${patient.id}/file`);
            if (res.data.status) {
                setAttachment(null);
                setSnackbar({ open: true, message: 'Attachment removed successfully.', severity: 'success' });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to remove attachment.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        }
    };

    return (
        <AdminLayout>
            <Head title={`Test Details #${patient.id}`} />
            <Box className="p-6 max-w-5xl mx-auto">
                {/* Navigation & Header */}
                <Box className="flex flex-wrap items-center justify-between mb-6 gap-3">
                    <Box className="flex items-center space-x-3">
                        <Button
                            component={Link}
                            href="/tests"
                            variant="outlined"
                            size="small"
                            startIcon={<ArrowBackIcon />}
                            sx={{ textTransform: 'none', borderRadius: 1.5 }}
                        >
                            Back to Tests
                        </Button>
                        <Box>
                            <Typography variant="h4" color="text.primary" className="font-bold">
                                Test Details
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Test ID #{patient.id}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TableChartIcon sx={{ color: '#10b981' }} />}
                            onClick={() => exportTestDetailsToExcel(patient)}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
                                borderColor: dark ? '#475569' : '#cbd5e1',
                                color: dark ? '#f8fafc' : '#0f172a',
                                backgroundColor: dark ? '#1e293b' : '#ffffff',
                                '&:hover': {
                                    borderColor: '#10b981',
                                    backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                }
                            }}
                        >
                            Export Excel
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PictureAsPdfIcon sx={{ color: '#ef4444' }} />}
                            onClick={() => exportTestDetailsToPdf(patient)}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
                                borderColor: dark ? '#475569' : '#cbd5e1',
                                color: dark ? '#f8fafc' : '#0f172a',
                                backgroundColor: dark ? '#1e293b' : '#ffffff',
                                '&:hover': {
                                    borderColor: '#ef4444',
                                    backgroundColor: dark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                }
                            }}
                        >
                            Export PDF
                        </Button>
                    </Stack>
                </Box>

                <Card
                    sx={{
                        borderRadius: 2.5,
                        backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                >
                    <CardContent className="p-6">
                        {/* Status Banner */}
                        <Paper
                            className="p-4 mb-6 flex items-center justify-between"
                            elevation={0}
                            sx={{
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                borderRadius: 2
                            }}
                        >
                            <Box>
                                <Typography variant="caption" color="text.secondary" className="block mb-1">
                                    Current Status
                                </Typography>
                                <Chip
                                    label={patient.status || 'Imported'}
                                    color={statusColor}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" className="block text-right">
                                    Created Date
                                </Typography>
                                <Typography variant="body2" color="text.primary" className="font-semibold">
                                    {patient.createdAt || '-'}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Patient & Sample Details */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3">
                            Patient & Sample Information
                        </Typography>
                        <Grid container spacing={3} className="mb-6">
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Donor Name</Typography>
                                <Typography variant="body1" color="text.primary" className="font-semibold">{patient.donorId || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Patient Code</Typography>
                                <Typography variant="body1" color="text.primary" className="font-semibold">{patient.patientId || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Collection Site</Typography>
                                <Typography variant="body1" color="text.primary">{patient.collectionSite || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Cup Lot Number</Typography>
                                <Typography variant="body1" color="text.primary">{patient.cupLotNumber || '-'}</Typography>
                            </Grid>
                        </Grid>

                        <Divider className="mb-6" />

                        {/* Device & Location Info */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3">
                            Device & Location Details
                        </Typography>
                        <Grid container spacing={3} className="mb-6">
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Device Name</Typography>
                                <Typography variant="body1" color="text.primary">{patient.device?.name || (patient as any).deviceName || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Device Code</Typography>
                                <Typography variant="body1" color="text.primary">{patient.device?.deviceCode || (patient as any).deviceCode || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Device Type</Typography>
                                <Typography variant="body1" color="text.primary">{patient.device?.deviceTypeName || (patient as any).deviceTypeName || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Location</Typography>
                                <Typography variant="body1" color="text.primary">{patient.device?.locationName || (patient as any).locationName || '-'}</Typography>
                            </Grid>
                        </Grid>

                        {/* Inspector Review Information (if present) */}
                        {patient.reviewedBy && (
                            <>
                                <Divider className="mb-6" />
                                <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3">
                                    Inspector Review Attribution
                                </Typography>
                                <Grid container spacing={3} className="mb-6">
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Inspector</Typography>
                                        <Typography variant="body1" color="text.primary" className="font-semibold">
                                            {patient.reviewedBy.name || patient.reviewedBy.email || '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Action</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={patient.reviewedBy.action}
                                                color={patient.reviewedBy.action === 'INSPECTOR_ACCEPT' ? 'success' : 'error'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Review Timestamp</Typography>
                                        <Typography variant="body1" color="text.primary">
                                            {patient.reviewedBy.reviewedAt || '-'}
                                        </Typography>
                                    </Grid>
                                    {patient.reviewedBy.reason && (
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">Inspector Reason / Notes</Typography>
                                            <Typography variant="body2" color="text.primary">
                                                {patient.reviewedBy.reason}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </>
                        )}

                        <Divider className="mb-6" />

                        {/* Test Document Attachment Section (PDF / Image) */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3">
                            Test Document Attachment (PDF / Image)
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                mb: 6,
                                borderRadius: 2.5,
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            }}
                        >
                            {attachment ? (
                                <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <Stack direction="row" spacing={2} alignItems="center">
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
                                            }}
                                        >
                                            {attachment.isImage ? (
                                                <ImageIcon sx={{ fontSize: 32 }} />
                                            ) : (
                                                <PictureAsPdfIcon sx={{ fontSize: 32 }} />
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography variant="body1" fontWeight={700} color="text.primary">
                                                {attachment.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={attachment.isImage ? 'Image Document' : 'PDF Document'}
                                                    size="small"
                                                    color={attachment.isImage ? 'primary' : 'error'}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem', height: 20 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Uploaded: {attachment.createdAt}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        {/* Download button available for all roles */}
                                        <Button
                                            component="a"
                                            href={`/tests/${patient.id}/file/download`}
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            sx={{ textTransform: 'none', borderRadius: 2 }}
                                        >
                                            Download
                                        </Button>

                                        {/* Image preview modal trigger */}
                                        {attachment.isImage && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => setPreviewOpen(true)}
                                                sx={{ textTransform: 'none', borderRadius: 2 }}
                                            >
                                                Preview
                                            </Button>
                                        )}

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
                                                    startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                                    disabled={uploading}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                                >
                                                    {uploading ? 'Uploading...' : 'Replace'}
                                                </Button>

                                                <Tooltip title="Remove attachment">
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={handleDeleteFile}
                                                        disabled={uploading}
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Stack>
                                </Box>
                            ) : (
                                <Box className="text-center py-4">
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {isEmployee
                                            ? 'No document attached to this test. You can upload a medical result PDF or Image.'
                                            : 'No document has been attached to this test by the employee.'}
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
                                                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                                                disabled={uploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                                            >
                                                {uploading ? 'Uploading...' : 'Upload PDF / Image'}
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            )}
                        </Paper>

                        <Divider className="mb-6" />

                        {/* Medical Test Substances & Results Table */}
                        <Typography variant="subtitle1" color="text.primary" className="font-semibold mb-3">
                            Medical Test Substances & Results (Read-Only)
                        </Typography>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            }}
                        >
                            <Table size="medium">
                                <TableHead sx={{ backgroundColor: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Substance</TableCell>
                                        <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Software Result</TableCell>
                                        <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Visual Result</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {patient.tests && patient.tests.length > 0 ? (
                                        patient.tests.map((substanceRow) => (
                                            <TableRow key={substanceRow.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell component="th" scope="row" sx={{ color: dark ? '#cbd5e1' : '#334155', fontWeight: 600 }}>
                                                    {substanceRow.substance}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#1e293b' }}>
                                                    {substanceRow.softwareResult || '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#1e293b' }}>
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

                {/* Image Preview Lightbox Dialog */}
                {attachment?.isImage && (
                    <Dialog
                        open={previewOpen}
                        onClose={() => setPreviewOpen(false)}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Preview: {attachment.name}</span>
                            <Button
                                component="a"
                                href={`/tests/${patient.id}/file/download`}
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                sx={{ textTransform: 'none' }}
                            >
                                Download
                            </Button>
                        </DialogTitle>
                        <DialogContent dividers sx={{ textAlign: 'center', p: 3 }}>
                            <img
                                src={attachment.url}
                                alt={attachment.name}
                                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                        </DialogActions>
                    </Dialog>
                )}

                {/* Snackbar Notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={5000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default PatientDetails;
