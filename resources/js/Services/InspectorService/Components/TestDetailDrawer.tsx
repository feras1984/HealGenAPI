import React from 'react';
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
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useInspectorContext } from "@/Services/InspectorService/State/InspectorContext";
import { useAppSelector } from "@/Redux/Store/hook";

import { usePage } from '@inertiajs/react';
import Tooltip from '@mui/material/Tooltip';

const TestDetailDrawer: React.FC = () => {
    const {
        selectedTest,
        isDrawerOpen,
        closeTestDetails,
        openAcceptDialog,
        openRejectModal,
        actionLoading
    } = useInspectorContext();
    const dark = useAppSelector(state => state.theme.dark);
    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || '').toLowerCase();
    const canInspect = ['inspector', 'administrator'].includes(userRole);

    if (!selectedTest) return null;

    return (
        <Drawer
            anchor="right"
            open={isDrawerOpen}
            onClose={closeTestDetails}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 540, md: 640 },
                    backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                    color: dark ? 'var(--clr-text-light, #fafafa)' : 'var(--clr-text-dark, #374151)',
                    p: 3,
                }
            }}
        >
            <Box className="flex justify-between items-center mb-4">
                <Box>
                    <Typography variant="h5" color="text.primary" className="font-bold">
                        Test Inspection
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Test ID #{selectedTest.id}
                    </Typography>
                </Box>
                <IconButton onClick={closeTestDetails} color="inherit" size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider className="mb-4" />

            {/* Action Bar */}
            <Paper
                className="p-3 mb-4 flex items-center justify-between"
                elevation={0}
                sx={{
                    backgroundColor: dark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    borderRadius: 2
                }}
            >
                <Box>
                    <Typography variant="caption" color="text.secondary" className="block">Current Status</Typography>
                    <Chip label={selectedTest.status || 'Imported'} color="warning" size="small" sx={{ fontWeight: 600 }} />
                </Box>
                <Box className="flex space-x-2">
                    {canInspect ? (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={openAcceptDialog}
                                disabled={actionLoading}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Accept Test
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={openRejectModal}
                                disabled={actionLoading}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Reject Test
                            </Button>
                        </>
                    ) : (
                        <Tooltip title="View Only: Only Inspectors can process test decisions.">
                            <span>
                                <Chip
                                    label="View Only Mode"
                                    color="default"
                                    variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                />
                            </span>
                        </Tooltip>
                    )}
                </Box>
            </Paper>

            {/* Patient & Sample Details */}
            <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2">
                Patient & Sample Information
            </Typography>
            <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Donor Name</Typography>
                    <Typography variant="body2" color="text.primary" className="font-semibold">{selectedTest.donorId || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Patient Code</Typography>
                    <Typography variant="body2" color="text.primary" className="font-semibold">{selectedTest.patientId || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Collection Site</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.collectionSite || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Cup Lot Number</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.cupLotNumber || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Received Timestamp</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.createdAt || '-'}</Typography>
                </Grid>
            </Grid>

            <Divider className="mb-4" />

            {/* Device & Location Info */}
            <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2">
                Device & Location Details
            </Typography>
            <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Device Name</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.device?.name || selectedTest.deviceName || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Device Code</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.device?.deviceCode || selectedTest.deviceCode || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Device Type</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.device?.deviceTypeName || selectedTest.deviceTypeName || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Location</Typography>
                    <Typography variant="body2" color="text.primary">{selectedTest.device?.locationName || selectedTest.locationName || '-'}</Typography>
                </Grid>
            </Grid>

            <Divider className="mb-4" />

            {/* Read-Only Medical Substances Results Table */}
            <Typography variant="subtitle2" color="text.primary" className="font-semibold mb-2">
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
                <Table size="small">
                    <TableHead sx={{ backgroundColor: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Substance</TableCell>
                            <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Software Result</TableCell>
                            <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Visual Result</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedTest.tests && selectedTest.tests.length > 0 ? (
                            selectedTest.tests.map((substanceRow) => (
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
                                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                                    No substance test rows recorded for this sample.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Drawer>
    );
};

export default TestDetailDrawer;
