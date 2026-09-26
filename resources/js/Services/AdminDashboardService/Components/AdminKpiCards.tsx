import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useAdminDashboardContext } from "@/Services/AdminDashboardService/State/AdminDashboardContext";
import { useAppSelector } from "@/Redux/Store/hook";

const AdminKpiCards: React.FC = () => {
    const { data } = useAdminDashboardContext();
    const kpis = data.kpis;
    const dark = useAppSelector(state => state.theme.dark);

    const cards = [
        {
            label: 'Total Locations',
            count: kpis.totalLocations || 0,
            colorLight: '#0288d1',
            colorDark: '#38bdf8',
            bgLight: '#e1f5fe',
            bgDark: '#0f172a',
        },
        {
            label: 'Active Devices',
            count: `${kpis.activeDevices || 0} / ${kpis.totalDevices || 0}`,
            colorLight: '#2e7d32',
            colorDark: '#4ade80',
            bgLight: '#e8f5e9',
            bgDark: '#064e3b',
        },
        {
            label: 'Total System Users',
            count: kpis.totalUsers || 0,
            colorLight: '#9c27b0',
            colorDark: '#c084fc',
            bgLight: '#f3e5f5',
            bgDark: '#1e1b4b',
        },
        {
            label: 'Today\'s Total Operations',
            count: kpis.todayOperations || 0,
            colorLight: '#1976d2',
            colorDark: '#60a5fa',
            bgLight: '#e3f2fd',
            bgDark: '#1e3a8a',
        },
        {
            label: 'Pending Inspector',
            count: kpis.pendingInspectorCount || 0,
            colorLight: '#ed6c02',
            colorDark: '#fb923c',
            bgLight: '#fff3e0',
            bgDark: '#1c1917',
        },
        {
            label: 'Pending Supervisor',
            count: kpis.pendingSupervisorCount || 0,
            colorLight: '#d32f2f',
            colorDark: '#f87171',
            bgLight: '#ffebee',
            bgDark: '#450a0a',
        },
    ];

    return (
        <Box className="mb-6">
            <Typography variant="h6" color="text.primary" className="mb-3 font-semibold">
                System Overview KPIs
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                {cards.map((card, idx) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={idx}>
                        <Card
                            sx={{
                                backgroundColor: dark ? card.bgDark : card.bgLight,
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 2,
                                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" color="text.secondary" className="font-medium uppercase tracking-wider block">
                                    {card.label}
                                </Typography>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: dark ? card.colorDark : card.colorLight,
                                        fontWeight: 'bold',
                                        mt: 0.5,
                                    }}
                                >
                                    {card.count}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default AdminKpiCards;
