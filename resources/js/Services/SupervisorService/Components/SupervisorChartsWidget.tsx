import React from 'react';
import { Grid, Box } from '@mui/material';
import { useSupervisorContext } from '../State/SupervisorContext';
import ActionActivityChart from '@/Components/Charts/ActionActivityChart';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';

export const SupervisorChartsWidget: React.FC = () => {
    const { data, loading } = useSupervisorContext();

    const chartData = data.activityChart;
    const trend = chartData?.trend || [];
    const breakdown = (chartData?.breakdown || []).map((b) => ({
        name: b.name,
        count: b.count,
    }));

    return (
        <Box className="mb-6 flex justify-center">
            <Grid container spacing={3} justifyContent="center">
                {/* Decision Trend Chart */}
                <Grid item xs={12} md={8}>
                    <ActionActivityChart
                        data={trend}
                        title="Supervisor Confirmation Activity Trend"
                        subtitle="Hourly confirmed vs rejected decisions today"
                        loading={loading}
                        height={280}
                        primaryLabel="Confirmed"
                        primaryColor="#059669"
                        secondaryColor="#dc2626"
                    />
                </Grid>

                {/* Decision Breakdown */}
                <Grid item xs={12} md={4}>
                    <CategoryBarChart
                        data={breakdown}
                        title="Review Breakdown"
                        subtitle="Processed supervisor reviews"
                        loading={loading}
                        height={280}
                        barColor="#059669"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default SupervisorChartsWidget;
