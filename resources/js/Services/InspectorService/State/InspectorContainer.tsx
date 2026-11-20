import React, { useState, useEffect, useCallback } from 'react';
import { usePage } from "@inertiajs/react";
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
    Tooltip,
    Chip,
    Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
    const { snackbar, setSnackbar, handleClose } = useSnackbarHook({ open: false, message: '', severity: 'info' });

    const pageProps = usePage().props as any;
    const currentUser = pageProps?.auth?.user || pageProps?.user;
    const role = String(data.userRole || currentUser?.role || '').toLowerCase();
    const isAdmin = role === 'administrator' || role === 'admin';

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
        setTimeout(() => {
            setSelectedTest(null);
        }, 350);
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
                    message: res.data.message || `Test #${selectedTest.id} forwarded!`,
                    severity: "success"
                });
                setIsAcceptDialogOpen(false);
                closeTestDetails();
                fetchLatest(filters, false);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Failed to forward test. Please try again.";
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
                    message: res.data.message || `Test #${selectedTest.id} sent for retest!`,
                    severity: "warning"
                });
                setIsRejectModalOpen(false);
                closeTestDetails();
                fetchLatest(filters, false);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Failed to request retest. Please try again.";
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
                handleRejectSubmit,
                setSnackbar,
            }}
        >
            <Box className="p-6">
                <Box className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <Typography variant="h4" color="text.primary" className="font-bold">
                        {t('inspector.dashboard') || 'Inspector Dashboard'}
                    </Typography>

                    {data.assignedLocation ? (
                        <Chip
                            icon={<LocationOnIcon />}
                            label={`${t('inspector.assignedLocation') || 'Assigned Location'}: ${data.assignedLocation.name} (${data.assignedLocation.code})`}
                            color="primary"
                            variant="outlined"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 1,
                                px: 0.5,
                                borderColor: 'primary.main',
                                backgroundColor: dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            }}
                        />
                    ) : isAdmin ? (
                        <Chip
                            icon={<LocationOnIcon />}
                            label={t('inspector.allLocationsAdmin') || 'All Locations (Administrator)'}
                            color="info"
                            variant="outlined"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 1,
                                px: 0.5,
                            }}
                        />
                    ) : (
                        <Chip
                            icon={<WarningAmberIcon />}
                            label={t('inspector.noAssignedLocation') || 'No Assigned Location'}
                            color="warning"
                            variant="outlined"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 1,
                                px: 0.5,
                            }}
                        />
                    )}
                </Box>

                {!isAdmin && !data.assignedLocation && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 4,
                            borderRadius: 2,
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: 'warning.main',
                        }}
                    >
                        <strong>{t('common.details') || 'Notice'}:</strong> {t('inspector.noticeNotAssigned') || 'You are not currently assigned to an active location. You will not see pending tests or be able to review tests until an administrator assigns you to a location.'}
                    </Alert>
                )}

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
                                {t('filters.queueFilters') || 'Queue Filters'}
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
                                            {t('filters.autoRefresh') || 'Auto-refresh (10s)'}
                                        </Typography>
                                    }
                                />
                                <Tooltip title={t('filters.refreshNow') || "Refresh Now"}>
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
                                    {t('filters.lastUpdated') || 'Updated: '}{lastUpdated.toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
                            <Grid item xs={12} sm={6} md={3} sx={{ flexGrow: 1, minWidth: 220 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('filters.location') || 'Location'}</InputLabel>
                                    <Select
                                        value={filters.locationId || (locations.length === 1 ? locations[0].id : '')}
                                        label={t('filters.location') || 'Location'}
                                        disabled={locations.length <= 1}
                                        onChange={(e) => updateFilter('locationId', e.target.value)}
                                    >
                                        {locations.length > 1 && <MenuItem value="">{t('filters.allLocations') || 'All Locations'}</MenuItem>}
                                        {locations.map((loc) => (
                                            <MenuItem key={loc.id} value={loc.id}>
                                                {loc.name} ({loc.code})
                                            </MenuItem>
                                        ))}
                                        {locations.length === 0 && (
                                            <MenuItem value="" disabled>{t('filters.noAssignedLocation') || 'No Assigned Location'}</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} sx={{ flexGrow: 1, minWidth: 220 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('filters.device') || 'Device'}</InputLabel>
                                    <Select
                                        value={filters.deviceId || ''}
                                        label={t('filters.device') || 'Device'}
                                        disabled={devices.length === 0}
                                        onChange={(e) => updateFilter('deviceId', e.target.value)}
                                    >
                                        <MenuItem value="">{t('filters.allDevices') || 'All Devices'}</MenuItem>
                                        {devices.map((dev) => (
                                            <MenuItem key={dev.id} value={dev.id}>
                                                {dev.name} ({dev.deviceCode})
                                            </MenuItem>
                                        ))}
                                        {devices.length === 0 && (
                                            <MenuItem value="" disabled>{t('filters.noDevicesAvailable') || 'No Devices Available'}</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2} sx={{ flexGrow: 1, minWidth: 170 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label={t('filters.date') || 'Date'}
                                    InputLabelProps={{ shrink: true }}
                                    value={filters.date || ''}
                                    onChange={(e) => updateFilter('date', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t('filters.search') || 'Search'}
                                    placeholder={t('placeholders.search') || 'Patient ID, Donor, Site...'}
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
                                    {t('filters.reset') || 'Reset'}
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
