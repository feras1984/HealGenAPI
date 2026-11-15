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
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const MonitorFilterToolbar: React.FC = () => {
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
    } = useMonitorContext();
    const dark = useAppSelector(state => state.theme.dark);

    const statusOptions = [
        'All',
        'Imported',
        'Awaiting Inspection',
        'Inspector Accepted',
        'Inspector Rejected',
        'Awaiting Supervisor',
        'Confirmed',
        'Supervisor Rejected',
        'Failed',
        'Blocked',
        'SentToHIS',
        'FailedToSend',
    ];

    const inputSx = {
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        color: dark ? '#f8fafc' : '#0f172a',
        borderRadius: 1,
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: dark ? '#475569' : '#cbd5e1',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: dark ? '#94a3b8' : '#64748b',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: dark ? '#38bdf8' : '#2563eb',
        },
        '& .MuiSelect-select': {
            color: dark ? '#f8fafc' : '#0f172a',
        },
        '& .MuiSelect-icon': {
            color: dark ? '#94a3b8' : '#64748b',
        },
        '& input': {
            color: dark ? '#f8fafc' : '#0f172a',
            backgroundColor: dark ? '#0f172a' : '#ffffff',
        },
    };

    const labelSx = {
        color: dark ? '#94a3b8' : '#475569',
        '&.Mui-focused': {
            color: dark ? '#38bdf8' : '#2563eb',
        },
    };

    return (
        <Card
            className="mb-6"
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? '#1e293b' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex flex-wrap items-center justify-between mb-4">
                    <Typography variant="h6" sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                        Operational Filters
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
                                <Typography variant="body2" sx={{ color: dark ? '#cbd5e1' : '#475569' }}>
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
                        <Typography variant="caption" sx={{ color: dark ? '#94a3b8' : '#64748b' }}>
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
                    <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={labelSx}>Location</InputLabel>
                            <Select
                                value={filters.locationId || ''}
                                label="Location"
                                onChange={(e) => updateFilter('locationId', e.target.value)}
                                sx={inputSx}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: dark ? '#1e293b' : '#ffffff',
                                            color: dark ? '#f8fafc' : '#0f172a',
                                        }
                                    }
                                }}
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

                    <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={labelSx}>Device</InputLabel>
                            <Select
                                value={filters.deviceId || ''}
                                label="Device"
                                onChange={(e) => updateFilter('deviceId', e.target.value)}
                                sx={inputSx}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: dark ? '#1e293b' : '#ffffff',
                                            color: dark ? '#f8fafc' : '#0f172a',
                                        }
                                    }
                                }}
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

                    <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={labelSx}>Status</InputLabel>
                            <Select
                                value={filters.status || 'All'}
                                label="Status"
                                onChange={(e) => updateFilter('status', e.target.value)}
                                sx={inputSx}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: dark ? '#1e293b' : '#ffffff',
                                            color: dark ? '#f8fafc' : '#0f172a',
                                        }
                                    }
                                }}
                            >
                                {statusOptions.map((st) => (
                                    <MenuItem key={st} value={st}>
                                        {st}
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
                            InputLabelProps={{ shrink: true, sx: labelSx }}
                            value={filters.date || ''}
                            onChange={(e) => updateFilter('date', e.target.value)}
                            sx={inputSx}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5} sx={{ flexGrow: 1, minWidth: 200 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search"
                            placeholder="Patient ID, Donor, Site..."
                            InputLabelProps={{ sx: labelSx }}
                            value={filters.search || ''}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            sx={inputSx}
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
                            sx={{
                                color: dark ? '#cbd5e1' : '#475569',
                                borderColor: dark ? '#475569' : '#cbd5e1',
                                '&:hover': {
                                    borderColor: dark ? '#94a3b8' : '#64748b',
                                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                }
                            }}
                        >
                            Reset
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default MonitorFilterToolbar;
