import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const RoleOperationsGrid: React.FC = () => {
    const { data } = useMonitorContext();
    const dark = useAppSelector(state => state.theme.dark);

    const roleOps = data.roleOperations || {
        roles: { Administrator: 0, Supervisor: 0, Inspector: 0, Employee: 0 },
        totalUsers: 0,
        activeUsers: 0,
        assignedDeviceUsers: 0,
    };

    const roleRows = [
        { role: 'Administrator', count: roleOps.roles.Administrator || 0 },
        { role: 'Supervisor', count: roleOps.roles.Supervisor || 0 },
        { role: 'Inspector', count: roleOps.roles.Inspector || 0 },
        { role: 'Employee', count: roleOps.roles.Employee || 0 },
    ];

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
                <Typography variant="h6" color="text.primary" className="mb-4 font-semibold">
                    Role & User Operational State
                </Typography>
                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: dark ? 'rgba(30, 58, 138, 0.3)' : '#eff6ff',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#2563eb' : '#3b82f6', color: '#ffffff', mr: 2 }}>
                                <PeopleIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Total System Users</Typography>
                                <Typography variant="h5" color="text.primary" className="font-bold">{roleOps.totalUsers}</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: dark ? 'rgba(6, 78, 59, 0.3)' : '#f0fdf4',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#16a34a' : '#22c55e', color: '#ffffff', mr: 2 }}>
                                <CheckCircleIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Active Account Users</Typography>
                                <Typography variant="h5" color="text.primary" className="font-bold">{roleOps.activeUsers}</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: dark ? 'rgba(88, 28, 135, 0.3)' : '#faf5ff',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#9333ea' : '#a855f7', color: '#ffffff', mr: 2 }}>
                                <DevicesIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Assigned to Devices</Typography>
                                <Typography variant="h5" color="text.primary" className="font-bold">{roleOps.assignedDeviceUsers}</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
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
                                        <TableCell sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Role Name</TableCell>
                                        <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>User Count</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roleRows.map((r) => (
                                        <TableRow key={r.role} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row" sx={{ color: dark ? '#cbd5e1' : '#334155' }}>
                                                {r.role}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: dark ? '#f1f5f9' : '#1e293b', fontWeight: 600 }}>
                                                {r.count}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default RoleOperationsGrid;
