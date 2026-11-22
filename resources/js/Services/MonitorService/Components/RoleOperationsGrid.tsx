import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Stack
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";
import { exportCustomTableToExcel, exportCustomTableToPdf } from "@/Utils/GridExportHelper";
import { useTranslation } from "react-i18next";

const RoleOperationsGrid: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data } = useMonitorContext();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || (i18n.language && i18n.language.startsWith('ar'));

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

    const getExportData = () => {
        const columns = [t('monitor.metricOrRole') || 'Metric / Role', t('monitor.count') || 'Count'];
        const rows: (string | number)[][] = [
            [t('monitor.totalUsers') || 'Total System Users', roleOps.totalUsers],
            [t('monitor.activeUsers') || 'Active Account Users', roleOps.activeUsers],
            [t('monitor.assignedDeviceUsers') || 'Assigned to Devices', roleOps.assignedDeviceUsers],
            ...roleRows.map(r => [t(`roles.${r.role}`) || r.role, r.count])
        ];
        return { columns, rows };
    };

    const handleExportExcel = () => {
        const { columns, rows } = getExportData();
        exportCustomTableToExcel({
            fileName: isRtl ? 'حالة_العمليات_للأدوار_والمستخدمين' : 'Role_User_Operations',
            title: t('monitor.roleOperations') || 'Role & User Operational State',
            columns,
            rows
        });
    };

    const handleExportPdf = () => {
        const { columns, rows } = getExportData();
        exportCustomTableToPdf({
            fileName: isRtl ? 'حالة_العمليات_للأدوار_والمستخدمين' : 'Role_User_Operations',
            title: t('monitor.roleOperations') || 'Role & User Operational State',
            columns,
            rows
        });
    };

    return (
        <Card
            className="mb-6"
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #102B22)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <CardContent>
                <Box className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <Typography variant="h6" sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                        {t('monitor.roleOperations') || 'Role & User Operational State'}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TableChartIcon sx={{ color: '#10b981' }} />}
                            onClick={handleExportExcel}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
                                borderColor: dark ? '#475569' : '#cbd5e1',
                                color: dark ? '#f8fafc' : '#0f172a',
                                backgroundColor: dark ? '#0f172a' : '#ffffff',
                                '&:hover': {
                                    borderColor: '#10b981',
                                    backgroundColor: dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                }
                            }}
                        >
                            {t('common.exportExcel') || 'Export Excel'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PictureAsPdfIcon sx={{ color: '#ef4444' }} />}
                            onClick={handleExportPdf}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1.5,
                                fontWeight: 600,
                                borderColor: dark ? '#475569' : '#cbd5e1',
                                color: dark ? '#f8fafc' : '#0f172a',
                                backgroundColor: dark ? '#0f172a' : '#ffffff',
                                '&:hover': {
                                    borderColor: '#ef4444',
                                    backgroundColor: dark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                }
                            }}
                        >
                            {t('common.exportPdf') || 'Export PDF'}
                        </Button>
                    </Stack>
                </Box>
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
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#2563eb' : '#3b82f6', color: '#ffffff', marginInlineEnd: 2 }}>
                                <PeopleIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('monitor.totalUsers') || 'Total System Users'}</Typography>
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
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#16a34a' : '#22c55e', color: '#ffffff', marginInlineEnd: 2 }}>
                                <CheckCircleIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('monitor.activeUsers') || 'Active Account Users'}</Typography>
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
                            <Box sx={{ p: 1.5, borderRadius: '50%', backgroundColor: dark ? '#9333ea' : '#a855f7', color: '#ffffff', marginInlineEnd: 2 }}>
                                <DevicesIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('monitor.assignedDeviceUsers') || 'Assigned to Devices'}</Typography>
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
                                backgroundColor: dark ? '#0f172a' : '#ffffff',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            }}
                        >
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: dark ? '#111827' : '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600, borderColor: dark ? '#374151' : '#cbd5e1' }}>
                                            {t('monitor.roleName') || 'Role Name'}
                                        </TableCell>
                                        <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600, borderColor: dark ? '#374151' : '#cbd5e1' }}>
                                            {t('monitor.userCount') || 'User Count'}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roleRows.map((r) => (
                                        <TableRow key={r.role} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row" sx={{ color: dark ? '#f8fafc' : '#0f172a', borderColor: dark ? '#334155' : '#f1f5f9' }}>
                                                {t(`roles.${r.role}`) || r.role}
                                            </TableCell>
                                            <TableCell align={isRtl ? 'left' : 'right'} sx={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600, borderColor: dark ? '#334155' : '#f1f5f9' }}>
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
