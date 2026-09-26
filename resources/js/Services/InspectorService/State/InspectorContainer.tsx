import React, { useState, useEffect, useCallback } from 'react';
import { Container as ServiceContainer } from "typedi";
import "typedi";
import InspectorService from "@/Services/InspectorService/InspectorService";
import { InspectorContainerProps } from "@/Services/InspectorService/Interfaces/InspectorProps";
import { InspectorDashboardData, InspectorFilterParams } from "@/models/inspector/InspectorData";
import PatientHeader from "@/models/patient/PatientHeader";
import { InspectorProvider } from "@/Services/InspectorService/State/InspectorContext";
import InspectorKpiCards from "@/Services/InspectorService/Components/InspectorKpiCards";
import InspectorChartsWidget from "@/Services/InspectorService/Components/InspectorChartsWidget";
import PendingQueueGrid from "@/Services/InspectorService/Components/PendingQueueGrid";
import TestDetailDrawer from "@/Services/InspectorService/Components/TestDetailDrawer";
import AcceptConfirmDialog from "@/Services/InspectorService/Components/AcceptConfirmDialog";
import RejectModal from "@/Services/InspectorService/Components/RejectModal";
import MyRecentActivity from "@/Services/InspectorService/Components/MyRecentActivity";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    IconButton,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { useAppSelector } from "@/Redux/Store/hook";

const InspectorContainer: React.FC<InspectorContainerProps> = ({
    initialData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const [data, setData] = useState<InspectorDashboardData>(initialData);
    const [filters, setFiltersState] = useState<InspectorFilterParams>(initialFilters);
    const [loading, setLoading] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const [selectedTest, setSelectedTest] = useState<PatientHeader | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState<boolean>(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const inspectorService = ServiceContainer.get(InspectorService);
    const dark = useAppSelector(state => state.theme.dark);
    const { snackbar, setSnackbar, handleClose } = useSnackbarHook({ open: false, message: '', severity: 'info' });

    const fetchLatest = useCallback((currentFilters: InspectorFilterParams, showLoading: boolean = false) => {
        if (showLoading) setLoading(true);

        inspectorService.fetchDashboardData(currentFilters)
            .then(res => {
                if (res.data && res.data.data) {
                    setData(res.data.data);
                    setLastUpdated(new Date());
                }
            })
            .catch(err => {
                console.error("Inspector poll error:", err);
                setSnackbar({
                    open: true,
                    message: "Failed to update inspector dashboard data.",
                    severity: "error"
                });
            })
            .finally(() => {
                if (showLoading) setLoading(false);
            });
    }, [inspectorService, setSnackbar]);

    // 10-second polling
    useEffect(() => {
        if (!autoRefresh) return;

        const intervalId = setInterval(() => {
            fetchLatest(filters, false);
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [autoRefresh, filters, fetchLatest]);

    const setFilters = (newFilters: InspectorFilterParams) => {
        setFiltersState(newFilters);
        fetchLatest(newFilters, true);
    };

    const updateFilter = (key: keyof InspectorFilterParams, value: any) => {
        const nextFilters = { ...filters, [key]: value };
        setFilters(nextFilters);
    };

    const clearFilters = () => {
        setFilters({});
    };

    const refreshData = async () => {
        fetchLatest(filters, true);
    };

    const toggleAutoRefresh = () => {
        setAutoRefresh(prev => !prev);
    };

    const openTestDetails = (test: PatientHeader) => {
        setSelectedTest(test);
        setIsDrawerOpen(true);
    };

    const closeTestDetails = () => {
        setIsDrawerOpen(false);
        setSelectedTest(null);
    };

    const openAcceptDialog = () => {
        setIsAcceptDialogOpen(true);
    };

    const closeAcceptDialog = () => {
        setIsAcceptDialogOpen(false);
    };

    const openRejectModal = () => {
        setIsRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setIsRejectModalOpen(false);
    };

    const handleAcceptConfirm = async () => {
        if (!selectedTest) return;
        setActionLoading(true);

        try {
            const res = await inspectorService.acceptTest(selectedTest.id);
            if (res.data.status) {
                setSnackbar({
                    open: true,
                    message: res.data.message || `Test #${selectedTest.id} accepted!`,
                    severity: "success"
                });
                setIsAcceptDialogOpen(false);
                closeTestDetails();
                fetchLatest(filters, false);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Failed to accept test. Please try again.";
            setSnackbar({
                open: true,
                message: errMsg,
                severity: "error"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!selectedTest) return;
        setActionLoading(true);

        try {
            const res = await inspectorService.rejectTest(selectedTest.id, reason);
            if (res.data.status) {
                setSnackbar({
                    open: true,
                    message: res.data.message || `Test #${selectedTest.id} rejected!`,
                    severity: "warning"
                });
                setIsRejectModalOpen(false);
                closeTestDetails();
                fetchLatest(filters, false);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Failed to reject test. Please try again.";
            setSnackbar({
                open: true,
                message: errMsg,
                severity: "error"
            });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <InspectorProvider
            value={{
                data,
                locations,
                devices,
                filters,
                loading,
                autoRefresh,
                lastUpdated,
                selectedTest,
                isDrawerOpen,
                isAcceptDialogOpen,
                isRejectModalOpen,
                actionLoading,
                setFilters,
                updateFilter,
                clearFilters,
                refreshData,
                toggleAutoRefresh,
                openTestDetails,
                closeTestDetails,
                openAcceptDialog,
                closeAcceptDialog,
                openRejectModal,
                closeRejectModal,
                handleAcceptConfirm,
                handleRejectSubmit
            }}
        >
            <Box className="p-6">
                <Box className="flex justify-between items-center mb-6">
                    <Typography variant="h4" color="text.primary" className="font-bold">
                        Inspector Dashboard
                    </Typography>
                </Box>

                {/* Operational Filters Toolbar */}
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
                        <Box className="flex flex-wrap items-center justify-between mb-4">
                            <Typography variant="h6" color="text.primary" className="font-semibold">
                                Queue Filters
                            </Typography>
                            <Box className="flex items-center space-x-3">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={autoRefresh}
                                            onChange={toggleAutoRefresh}
                                            color="primary"
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color="text.secondary">
                                            Auto-refresh (10s)
                                        </Typography>
                                    }
                                />
                                <Tooltip title="Refresh Now">
                                    <span>
                                        <IconButton
                                            onClick={refreshData}
                                            disabled={loading}
                                            color="primary"
                                            size="small"
                                        >
                                            <RefreshIcon className={loading ? 'animate-spin' : ''} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary">
                                    Updated: {lastUpdated.toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
                            <Grid item xs={12} sm={6} md={3} sx={{ flexGrow: 1, minWidth: 220 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Location</InputLabel>
                                    <Select
                                        value={filters.locationId || ''}
                                        label="Location"
                                        onChange={(e) => updateFilter('locationId', e.target.value)}
                                    >
                                        <MenuItem value="">All Locations</MenuItem>
                                        {locations.map((loc) => (
                                            <MenuItem key={loc.id} value={loc.id}>
                                                {loc.name} ({loc.code})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} sx={{ flexGrow: 1, minWidth: 220 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Device</InputLabel>
                                    <Select
                                        value={filters.deviceId || ''}
                                        label="Device"
                                        onChange={(e) => updateFilter('deviceId', e.target.value)}
                                    >
                                        <MenuItem value="">All Devices</MenuItem>
                                        {devices.map((dev) => (
                                            <MenuItem key={dev.id} value={dev.id}>
                                                {dev.name} ({dev.deviceCode})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2} sx={{ flexGrow: 1, minWidth: 170 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.date || ''}
                                    onChange={(e) => updateFilter('date', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search"
                                    placeholder="Patient ID, Donor, Site..."
                                    value={filters.search || ''}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md="auto" sx={{ minWidth: 120 }}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<FilterAltOffIcon />}
                                    onClick={clearFilters}
                                    size="small"
                                    fullWidth
                                >
                                    Reset
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <InspectorKpiCards />
                <InspectorChartsWidget />
                <PendingQueueGrid />
                <MyRecentActivity />

                {/* Detail View & Action Modals */}
                <TestDetailDrawer />
                <AcceptConfirmDialog />
                <RejectModal />
            </Box>

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </InspectorProvider>
    );
};

export default InspectorContainer;
