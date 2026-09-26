import React from 'react';
import PatientHeader from "@/models/patient/PatientHeader";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
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
    Button
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

const PatientDetails: React.FC<{ patient: PatientHeader }> = ({ patient }) => {
    const dark = useAppSelector(state => state.theme.dark);
    const statusColor = statusColorMap[patient.status] || 'default';

    return (
        <AdminLayout>
            <Head title={`Test Details #${patient.id}`} />
            <Box className="p-6 max-w-5xl mx-auto">
                {/* Navigation & Header */}
                <Box className="flex items-center justify-between mb-6">
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
            </Box>
        </AdminLayout>
    );
};

export default PatientDetails;
