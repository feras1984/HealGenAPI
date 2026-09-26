import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const SupervisorKpiCards: React.FC = () => {
    const { data } = useSupervisorContext();
    const kpis = data.kpis;
    const dark = useAppSelector(state => state.theme.dark);

    const cards = [
        {
            label: 'Pending Supervisor Review',
            count: kpis.pendingCount || 0,
            colorLight: '#ed6c02',
            colorDark: '#fb923c',
            bgLight: '#fff3e0',
            bgDark: '#1c1917',
        },
        {
            label: 'Confirmed Today',
            count: kpis.confirmedTodayCount || 0,
            colorLight: '#2e7d32',
            colorDark: '#4ade80',
            bgLight: '#e8f5e9',
            bgDark: '#064e3b',
        },
        {
            label: 'Rejected Today',
            count: kpis.rejectedTodayCount || 0,
            colorLight: '#d32f2f',
            colorDark: '#f87171',
            bgLight: '#ffebee',
            bgDark: '#450a0a',
        },
        {
            label: 'Total Processed Today',
            count: kpis.processedTodayCount || 0,
            colorLight: '#0288d1',
            colorDark: '#38bdf8',
            bgLight: '#e1f5fe',
            bgDark: '#0f172a',
        },
    ];

    return (
        <Box className="mb-6">
            <Typography variant="h6" color="text.primary" className="mb-3 font-semibold">
                Supervisor Overview
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                {cards.map((card, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Card
                            sx={{
                                backgroundColor: dark ? card.bgDark : card.bgLight,
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 2,
                                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Typography variant="caption" color="text.secondary" className="font-medium uppercase tracking-wider">
                                    {card.label}
                                </Typography>
                                <Typography
                                    variant="h3"
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

export default SupervisorKpiCards;
