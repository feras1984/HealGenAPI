import React from 'react';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Switch,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { useAdminDashboardContext } from "@/Services/AdminDashboardService/State/AdminDashboardContext";
import { useAppSelector } from "@/Redux/Store/hook";

const AdminFilterToolbar: React.FC = () => {
    const {
        locations,
        devices,
        filters,
        updateFilter,
        clearFilters,
        refreshData,
        loading,
        autoRefresh,
        toggleAutoRefresh,
        lastUpdated
    } = useAdminDashboardContext();
    const dark = useAppSelector(state => state.theme.dark);

    return (
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
                        System Operations Filters
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
    );
};

export default AdminFilterToolbar;
