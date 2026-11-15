import React, { useState } from 'react';
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import axios from 'axios';
import {
    Box,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Alert,
    Snackbar,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface AssignmentItem {
    id: number;
    locationId: number;
    locationName: string;
    locationCode: string;
    userId: number;
    userName: string;
    userEmail: string;
    assignedAt: string;
    unassignedAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface LocationItem {
    id: number;
    name: string;
    code: string;
    city?: string;
    country?: string;
    isActive?: boolean;
    activeInspector?: { id: number; name: string; email: string } | null;
}

export interface InspectorItem {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
}

interface LocationInspectorListProps {
    assignments: AssignmentItem[];
    locations: LocationItem[];
    inspectors: InspectorItem[];
}

const LocationInspectorList: React.FC<LocationInspectorListProps> = ({
    assignments = [],
    locations = [],
    inspectors = [],
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

    // Modals state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

    // Form inputs
    const [selectedInspectorId, setSelectedInspectorId] = useState<number | ''>('');
    const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
    const [newLocationId, setNewLocationId] = useState<number | ''>('');
    const [submitting, setSubmitting] = useState(false);

    // Feedback notifications
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const activeAssignments = assignments.filter(a => a.isActive);
    const inactiveAssignments = assignments.filter(a => !a.isActive);

    const filteredAssignments = assignments.filter(item => {
        if (statusFilter === 'active' && !item.isActive) return false;
        if (statusFilter === 'inactive' && item.isActive) return false;

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            const matchLoc = item.locationName.toLowerCase().includes(term) || item.locationCode.toLowerCase().includes(term);
            const matchUser = item.userName.toLowerCase().includes(term) || item.userEmail.toLowerCase().includes(term);
            return matchLoc || matchUser;
        }

        return true;
    });

    const getInspectorDisplayName = (insp: InspectorItem): string => {
        if (insp.fullName && insp.fullName.trim() !== '') return insp.fullName;
        if (insp.firstName || insp.lastName) return `${insp.firstName ?? ''} ${insp.lastName ?? ''}`.trim();
        if (insp.name && insp.name.trim() !== '') return insp.name;
        return insp.email;
    };

    // Assign Inspector to Location
    const handleAssignSubmit = async () => {
        if (!selectedInspectorId || !selectedLocationId) {
            setSnackbar({ open: true, message: 'Please select both an inspector and a location.', severity: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post('/location-inspectors/assign', {
                location_id: selectedLocationId,
                user_id: selectedInspectorId,
            });

            if (response.data.status) {
                setSnackbar({ open: true, message: response.data.message || 'Inspector assigned successfully!', severity: 'success' });
                setAssignModalOpen(false);
                setSelectedInspectorId('');
                setSelectedLocationId('');
                router.reload({ only: ['assignments', 'locations'] });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Error assigning inspector.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Transfer Inspector to New Location
    const handleTransferSubmit = async () => {
        if (!selectedAssignment || !newLocationId) {
            setSnackbar({ open: true, message: 'Please select a new location.', severity: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.patch(`/location-inspectors/${selectedAssignment.id}/transfer`, {
                new_location_id: newLocationId,
            });

            if (response.data.status) {
                setSnackbar({ open: true, message: response.data.message || 'Inspector transferred successfully!', severity: 'success' });
                setTransferModalOpen(false);
                setSelectedAssignment(null);
                setNewLocationId('');
                router.reload({ only: ['assignments', 'locations'] });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Error transferring inspector.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Unassign Inspector
    const handleUnassignSubmit = async () => {
        if (!selectedAssignment) return;

        setSubmitting(true);
        try {
            const response = await axios.patch(`/location-inspectors/${selectedAssignment.id}/unassign`);

            if (response.data.status) {
                setSnackbar({ open: true, message: response.data.message || 'Inspector unassigned successfully!', severity: 'success' });
                setUnassignModalOpen(false);
                setSelectedAssignment(null);
                router.reload({ only: ['assignments', 'locations'] });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Error unassigning inspector.';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Location Inspector Assignments" />
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Header & Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link href="/locations" style={{ textDecoration: 'none', color: '#1976d2' }}>Locations</Link>
                    <Typography color="text.primary">Inspector Assignments</Typography>
                </Breadcrumbs>

                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Inspector Location Assignments
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage location-based authorization for inspectors. Each location has one active inspector.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setAssignModalOpen(true)}
                        sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Assign Inspector
                    </Button>
                </Stack>

                {/* KPI Metrics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1} sx={{ borderRadius: 2.5 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ACTIVE ASSIGNMENTS</Typography>
                                        <Typography variant="h4" fontWeight={700} color="primary.main">{activeAssignments.length}</Typography>
                                    </Box>
                                    <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 36, opacity: 0.8 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1} sx={{ borderRadius: 2.5 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL LOCATIONS</Typography>
                                        <Typography variant="h4" fontWeight={700}>{locations.length}</Typography>
                                    </Box>
                                    <LocationOnIcon color="action" sx={{ fontSize: 36, opacity: 0.8 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1} sx={{ borderRadius: 2.5 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>INSPECTORS</Typography>
                                        <Typography variant="h4" fontWeight={700}>{inspectors.length}</Typography>
                                    </Box>
                                    <PersonIcon color="action" sx={{ fontSize: 36, opacity: 0.8 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1} sx={{ borderRadius: 2.5 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>HISTORICAL ASSIGNMENTS</Typography>
                                        <Typography variant="h4" fontWeight={700} color="text.secondary">{inactiveAssignments.length}</Typography>
                                    </Box>
                                    <HistoryIcon color="action" sx={{ fontSize: 36, opacity: 0.8 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Card elevation={1} sx={{ mb: 3, borderRadius: 2.5 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                            <TextField
                                size="small"
                                placeholder="Search location or inspector..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 320 } }}
                            />

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setStatusFilter('active')}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                    Active ({activeAssignments.length})
                                </Button>
                                <Button
                                    variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setStatusFilter('all')}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                    All ({assignments.length})
                                </Button>
                                <Button
                                    variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setStatusFilter('inactive')}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                    History ({inactiveAssignments.length})
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Table of Assignments */}
                <Card elevation={1} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Inspector</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Assigned Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAssignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No inspector assignments found.
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={() => setAssignModalOpen(true)}
                                                sx={{ mt: 1.5, textTransform: 'none' }}
                                            >
                                                Assign an Inspector
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssignments.map((assignment) => (
                                        <TableRow key={assignment.id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {assignment.locationName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Code: {assignment.locationCode}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {assignment.userName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {assignment.userEmail}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {assignment.assignedAt}
                                                </Typography>
                                                {assignment.unassignedAt && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Unassigned: {assignment.unassignedAt}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {assignment.isActive ? (
                                                    <Chip label="Active" color="success" size="small" variant="filled" sx={{ fontWeight: 600 }} />
                                                ) : (
                                                    <Chip label="Inactive" color="default" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {assignment.isActive ? (
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="Transfer Inspector to another Location">
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                size="small"
                                                                startIcon={<SwapHorizIcon />}
                                                                onClick={() => {
                                                                    setSelectedAssignment(assignment);
                                                                    setNewLocationId('');
                                                                    setTransferModalOpen(true);
                                                                }}
                                                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                                            >
                                                                Transfer
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Unassign Inspector from this Location">
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                startIcon={<LinkOffIcon />}
                                                                onClick={() => {
                                                                    setSelectedAssignment(assignment);
                                                                    setUnassignModalOpen(true);
                                                                }}
                                                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                                            >
                                                                Unassign
                                                            </Button>
                                                        </Tooltip>
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Historical record
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                {/* Modal 1: Assign Inspector */}
                <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        Assign Inspector to Location
                    </DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Business Rule: Each location can have only <strong>one active inspector</strong>, and an inspector can be assigned to only <strong>one active location</strong>. Any prior active assignment is automatically updated.
                        </Alert>

                        <Stack spacing={2.5}>
                            <FormControl fullWidth>
                                <InputLabel id="assign-inspector-label">Select Inspector</InputLabel>
                                <Select
                                    labelId="assign-inspector-label"
                                    value={selectedInspectorId}
                                    label="Select Inspector"
                                    onChange={(e) => setSelectedInspectorId(Number(e.target.value))}
                                >
                                    {inspectors.map((insp) => (
                                        <MenuItem key={insp.id} value={insp.id}>
                                            {getInspectorDisplayName(insp)} ({insp.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel id="assign-location-label">Select Location</InputLabel>
                                <Select
                                    labelId="assign-location-label"
                                    value={selectedLocationId}
                                    label="Select Location"
                                    onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                                >
                                    {locations.map((loc) => (
                                        <MenuItem key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.code})
                                            {loc.activeInspector ? ` - Currently: ${loc.activeInspector.name}` : ' - [Vacant]'}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setAssignModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleAssignSubmit}
                            disabled={submitting || !selectedInspectorId || !selectedLocationId}
                        >
                            {submitting ? 'Assigning...' : 'Assign Inspector'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal 2: Transfer Inspector */}
                <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        Transfer Inspector
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedAssignment && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body1">
                                    Transferring <strong>{selectedAssignment.userName}</strong> from <strong>{selectedAssignment.locationName}</strong> to a new location.
                                </Typography>
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    The inspector will immediately lose authorization to {selectedAssignment.locationName} and gain authorization to the selected new location. Historical test decisions remain unchanged.
                                </Alert>
                            </Box>
                        )}

                        <FormControl fullWidth>
                            <InputLabel id="transfer-location-label">New Location</InputLabel>
                            <Select
                                labelId="transfer-location-label"
                                value={newLocationId}
                                label="New Location"
                                onChange={(e) => setNewLocationId(Number(e.target.value))}
                            >
                                {locations
                                    .filter(loc => loc.id !== selectedAssignment?.locationId)
                                    .map((loc) => (
                                        <MenuItem key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.code})
                                            {loc.activeInspector ? ` - Currently: ${loc.activeInspector.name}` : ' - [Vacant]'}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setTransferModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleTransferSubmit}
                            disabled={submitting || !newLocationId}
                        >
                            {submitting ? 'Transferring...' : 'Confirm Transfer'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal 3: Unassign Inspector Confirmation */}
                <Dialog open={unassignModalOpen} onClose={() => setUnassignModalOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        Unassign Inspector?
                    </DialogTitle>
                    <DialogContent>
                        {selectedAssignment && (
                            <Typography variant="body2" color="text.secondary">
                                Are you sure you want to unassign <strong>{selectedAssignment.userName}</strong> from <strong>{selectedAssignment.locationName}</strong>? The inspector will no longer have access to this location's tests.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setUnassignModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleUnassignSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Unassigning...' : 'Unassign'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Toast Snackbar */}
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

export default LocationInspectorList;
