import React, { useState, useEffect, useCallback } from 'react';
import { Container as ServiceContainer } from "typedi";
import "typedi";
import AdminDashboardService from "@/Services/AdminDashboardService/AdminDashboardService";
import { AdminDashboardContainerProps } from "@/Services/AdminDashboardService/Interfaces/AdminDashboardProps";
import { AdminDashboardData, AdminFilterParams } from "@/models/admin/AdminDashboardData";
import { AdminDashboardProvider } from "@/Services/AdminDashboardService/State/AdminDashboardContext";
import AdminKpiCards from "@/Services/AdminDashboardService/Components/AdminKpiCards";
import QuickActionCards from "@/Services/AdminDashboardService/Components/QuickActionCards";
import AdminChartsWidget from "@/Services/AdminDashboardService/Components/AdminChartsWidget";
import AdminFilterToolbar from "@/Services/AdminDashboardService/Components/AdminFilterToolbar";
import SystemRecentOperationsGrid from "@/Services/AdminDashboardService/Components/SystemRecentOperationsGrid";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { Box, Typography } from '@mui/material';

const AdminDashboardContainer: React.FC<AdminDashboardContainerProps> = ({
    initialData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const [data, setData] = useState<AdminDashboardData>(initialData);
    const [filters, setFiltersState] = useState<AdminFilterParams>(initialFilters);
    const [loading, setLoading] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const adminDashboardService = ServiceContainer.get(AdminDashboardService);
    const { snackbar, setSnackbar, handleClose } = useSnackbarHook({ open: false, message: '', severity: 'info' });

    const fetchLatest = useCallback((currentFilters: AdminFilterParams, showLoading: boolean = false) => {
        if (showLoading) setLoading(true);

        adminDashboardService.fetchDashboardData(currentFilters)
            .then(res => {
                if (res.data && res.data.data) {
                    setData(res.data.data);
                    setLastUpdated(new Date());
                }
            })
            .catch(err => {
                console.error("Admin dashboard poll error:", err);
                setSnackbar({
                    open: true,
                    message: "Failed to update admin dashboard operational data.",
                    severity: "error"
                });
            })
            .finally(() => {
                if (showLoading) setLoading(false);
            });
    }, [adminDashboardService, setSnackbar]);

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

    const setFilters = (newFilters: AdminFilterParams) => {
        setFiltersState(newFilters);
        fetchLatest(newFilters, true);
    };

    const updateFilter = (key: keyof AdminFilterParams, value: any) => {
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

    return (
        <AdminDashboardProvider
            value={{
                data,
                locations,
                devices,
                filters,
                loading,
                autoRefresh,
                lastUpdated,
                setFilters,
                updateFilter,
                clearFilters,
                refreshData,
                toggleAutoRefresh
            }}
        >
            <Box className="p-6">
                <Box className="flex justify-between items-center mb-6">
                    <Typography variant="h4" color="text.primary" className="font-bold">
                        Administrator Dashboard
                    </Typography>
                </Box>

                <AdminKpiCards />
                <QuickActionCards />
                <AdminChartsWidget />
                <AdminFilterToolbar />
                <SystemRecentOperationsGrid />
            </Box>

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </AdminDashboardProvider>
    );
};

export default AdminDashboardContainer;
