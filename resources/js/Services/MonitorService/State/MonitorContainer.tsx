import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container as ServiceContainer } from "typedi";
import "typedi";
import MonitorService from "@/Services/MonitorService/MonitorService";
import { MonitorContainerProps } from "@/Services/MonitorService/Interfaces/MonitorProps";
import { MonitorData, MonitorFilterParams } from "@/models/monitor/MonitorData";
import { MonitorProvider } from "@/Services/MonitorService/State/MonitorContext";
import SummaryCards from "@/Services/MonitorService/Components/SummaryCards";
import MonitorChartsWidget from "@/Services/MonitorService/Components/MonitorChartsWidget";
import PipelineWidget from "@/Services/MonitorService/Components/PipelineWidget";
import MonitorFilterToolbar from "@/Services/MonitorService/Components/MonitorFilterToolbar";
import TestOperationsGrid from "@/Services/MonitorService/Components/TestOperationsGrid";
import DeviceOperationsGrid from "@/Services/MonitorService/Components/DeviceOperationsGrid";
import RoleOperationsGrid from "@/Services/MonitorService/Components/RoleOperationsGrid";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { Box, Typography } from '@mui/material';

const MonitorContainer: React.FC<MonitorContainerProps> = ({
    initialData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const [data, setData] = useState<MonitorData>(initialData);
    const [filters, setFiltersState] = useState<MonitorFilterParams>(initialFilters);
    const [loading, setLoading] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const monitorService = ServiceContainer.get(MonitorService);
    const { snackbar, setSnackbar, handleClose } = useSnackbarHook({ open: false, message: '', severity: 'info' });

    const fetchLatest = useCallback((currentFilters: MonitorFilterParams, showLoading: boolean = false) => {
        if (showLoading) setLoading(true);

        monitorService.fetchMonitorData(currentFilters)
            .then(res => {
                if (res.data && res.data.data) {
                    setData(res.data.data);
                    setLastUpdated(new Date());
                }
            })
            .catch(err => {
                console.error("Monitor poll error:", err);
                setSnackbar({
                    open: true,
                    message: "Failed to update monitor operational data.",
                    severity: "error"
                });
            })
            .finally(() => {
                if (showLoading) setLoading(false);
            });
    }, [monitorService, setSnackbar]);

    // Polling effect (10 seconds)
    useEffect(() => {
        if (!autoRefresh) return;

        const intervalId = setInterval(() => {
            fetchLatest(filters, false);
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [autoRefresh, filters, fetchLatest]);

    const setFilters = (newFilters: MonitorFilterParams) => {
        setFiltersState(newFilters);
        fetchLatest(newFilters, true);
    };

    const updateFilter = (key: keyof MonitorFilterParams, value: any) => {
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
        <MonitorProvider
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
                        Operational Monitor
                    </Typography>
                </Box>

                <MonitorFilterToolbar />
                <SummaryCards />
                <MonitorChartsWidget />
                <PipelineWidget />
                <TestOperationsGrid />
                <DeviceOperationsGrid />
                <RoleOperationsGrid />
            </Box>

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </MonitorProvider>
    );
};

export default MonitorContainer;
