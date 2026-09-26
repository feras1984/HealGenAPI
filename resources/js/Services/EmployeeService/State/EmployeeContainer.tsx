import React, { useState, useEffect, useCallback } from 'react';
import { Container as ServiceContainer } from "typedi";
import "typedi";
import EmployeeDashboardService from "@/Services/EmployeeService/EmployeeDashboardService";
import { EmployeeContainerProps } from "@/Services/EmployeeService/Interfaces/EmployeeProps";
import { EmployeeDashboardData, EmployeeFilterParams } from "@/models/employee/EmployeeData";
import { EmployeeProvider } from "@/Services/EmployeeService/State/EmployeeContext";
import EmployeeKpiCards from "@/Services/EmployeeService/Components/EmployeeKpiCards";
import EmployeeFilterToolbar from "@/Services/EmployeeService/Components/EmployeeFilterToolbar";
import AssignedDevicesGrid from "@/Services/EmployeeService/Components/AssignedDevicesGrid";
import MyDeviceTestsGrid from "@/Services/EmployeeService/Components/MyDeviceTestsGrid";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { Box, Typography } from '@mui/material';

const EmployeeContainer: React.FC<EmployeeContainerProps> = ({
    initialData,
    locations,
    devices,
    initialFilters = {}
}) => {
    const [data, setData] = useState<EmployeeDashboardData>(initialData);
    const [filters, setFiltersState] = useState<EmployeeFilterParams>(initialFilters);
    const [loading, setLoading] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const employeeService = ServiceContainer.get(EmployeeDashboardService);
    const { snackbar, setSnackbar, handleClose } = useSnackbarHook({ open: false, message: '', severity: 'info' });

    const fetchLatest = useCallback((currentFilters: EmployeeFilterParams, showLoading: boolean = false) => {
        if (showLoading) setLoading(true);

        employeeService.fetchDashboardData(currentFilters)
            .then(res => {
                if (res.data && res.data.data) {
                    setData(res.data.data);
                    setLastUpdated(new Date());
                }
            })
            .catch(err => {
                console.error("Employee poll error:", err);
                setSnackbar({
                    open: true,
                    message: "Failed to update employee operational data.",
                    severity: "error"
                });
            })
            .finally(() => {
                if (showLoading) setLoading(false);
            });
    }, [employeeService, setSnackbar]);

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

    const setFilters = (newFilters: EmployeeFilterParams) => {
        setFiltersState(newFilters);
        fetchLatest(newFilters, true);
    };

    const updateFilter = (key: keyof EmployeeFilterParams, value: any) => {
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
        <EmployeeProvider
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
                        Employee Dashboard (Assigned Devices Only)
                    </Typography>
                </Box>

                <EmployeeFilterToolbar />
                <EmployeeKpiCards />
                <AssignedDevicesGrid />
                <MyDeviceTestsGrid />
            </Box>

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </EmployeeProvider>
    );
};

export default EmployeeContainer;
