import React from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useMonitorContext } from "@/Services/MonitorService/State/MonitorContext";
import { useAppSelector } from "@/Redux/Store/hook";

const PipelineWidget: React.FC = () => {
    const { data } = useMonitorContext();
    const summary = data.summary;
    const total = summary.total || 1;
    const dark = useAppSelector(state => state.theme.dark);

    const stages = [
        {
            title: '1. Received',
            count: summary.Imported || 0,
            subtext: 'Ingested from device',
            color: dark ? '#38bdf8' : '#0288d1',
        },
        {
            title: '2. Inspection Stage',
            count: (summary['Awaiting Inspection'] || 0) + (summary['Inspector Accepted'] || 0) + (summary['Inspector Rejected'] || 0),
            subtext: `${summary['Awaiting Inspection'] || 0} pending`,
            color: dark ? '#fb923c' : '#ed6c02',
        },
        {
            title: '3. Supervisor Review',
            count: (summary['Awaiting Supervisor'] || 0) + (summary['Confirmed'] || 0) + (summary['Supervisor Rejected'] || 0),
            subtext: `${summary['Awaiting Supervisor'] || 0} pending`,
            color: dark ? '#c084fc' : '#9c27b0',
        },
        {
            title: '4. Final Result / HIS',
            count: (summary.SentToHIS || 0) + (summary.FailedToSend || 0) + (summary.Blocked || 0),
            subtext: `${summary.SentToHIS || 0} sent to HIS`,
            color: dark ? '#4ade80' : '#2e7d32',
        },
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
                    Test Operations Pipeline
                </Typography>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    {stages.map((stage, idx) => (
                        <React.Fragment key={idx}>
                            <Grid item xs={12} sm={5} md={2.5}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: dark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                                        border: '1px solid',
                                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.primary" className="font-semibold">
                                        {stage.title}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: stage.color, my: 0.5, fontWeight: 'bold' }}>
                                        {stage.count}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {stage.subtext}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(100, Math.round((stage.count / total) * 100))}
                                        sx={{
                                            mt: 1.5,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                                            '& .MuiLinearProgress-bar': { backgroundColor: stage.color },
                                        }}
                                    />
                                </Box>
                            </Grid>
                            {idx < stages.length - 1 && (
                                <Grid item xs={12} md={0.5} className="hidden md:flex justify-center">
                                    <ArrowForwardIosIcon sx={{ color: dark ? '#94a3b8' : '#64748b' }} fontSize="small" />
                                </Grid>
                            )}
                        </React.Fragment>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default PipelineWidget;
