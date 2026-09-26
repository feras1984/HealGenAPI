import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const SummaryCards: React.FC = () => {
    const { data } = useMonitorContext();
    const summary = data.summary;
    const dark = useAppSelector(state => state.theme.dark);

    const cards = [
        {
            label: 'Imported',
            count: summary.Imported || 0,
            colorLight: '#0288d1',
            colorDark: '#38bdf8',
            bgLight: '#e1f5fe',
            bgDark: '#0f172a',
        },
        {
            label: 'Inspection',
            count: (summary['Awaiting Inspection'] || 0) + (summary['Inspector Accepted'] || 0) + (summary['Inspector Rejected'] || 0),
            colorLight: '#ed6c02',
            colorDark: '#fb923c',
            bgLight: '#fff3e0',
            bgDark: '#1c1917',
        },
        {
            label: 'Supervisor',
            count: (summary['Awaiting Supervisor'] || 0) + (summary['Confirmed'] || 0) + (summary['Supervisor Rejected'] || 0),
            colorLight: '#9c27b0',
            colorDark: '#c084fc',
            bgLight: '#f3e5f5',
            bgDark: '#1e1b4b',
        },
        {
            label: 'Sent to HIS',
            count: summary.SentToHIS || 0,
            colorLight: '#2e7d32',
            colorDark: '#4ade80',
            bgLight: '#e8f5e9',
            bgDark: '#064e3b',
        },
        {
            label: 'Blocked',
            count: summary.Blocked || 0,
            colorLight: '#d32f2f',
            colorDark: '#f87171',
            bgLight: '#ffebee',
            bgDark: '#450a0a',
        },
        {
            label: 'Failed to Send',
            count: summary.FailedToSend || 0,
            colorLight: '#c62828',
            colorDark: '#f87171',
            bgLight: '#ffcdd2',
            bgDark: '#450a0a',
        },
        {
            label: 'Total Operations',
            count: summary.total || 0,
            colorLight: '#1976d2',
            colorDark: '#60a5fa',
            bgLight: '#e3f2fd',
            bgDark: '#1e3a8a',
        },
    ];

    return (
        <Box className="mb-6">
            <Typography variant="h6" color="text.primary" className="mb-3 font-semibold">
                Test Workflow Summary
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                {cards.map((card, idx) => (
                    <Grid item xs={12} sm={6} md={3} lg={1.7} key={idx}>
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
                                <Typography variant="caption" color="text.secondary" className="font-medium">
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

export default SummaryCards;
