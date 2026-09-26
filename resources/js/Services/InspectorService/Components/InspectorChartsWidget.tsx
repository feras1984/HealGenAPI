import React from 'react';
import { Grid, Box } from '@mui/material';
import { useInspectorContext } from '../State/InspectorContext';
import ActionActivityChart from '@/Components/Charts/ActionActivityChart';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';

export const InspectorChartsWidget: React.FC = () => {
    const { data, loading } = useInspectorContext();

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
                        title="Inspection Decision Activity Trend"
                        subtitle="Hourly accepted vs rejected decisions today"
                        loading={loading}
                        height={280}
                        primaryLabel="Accepted"
                        primaryColor="#10b981"
                        secondaryColor="#ef4444"
                    />
                </Grid>

                {/* Decision Breakdown */}
                <Grid item xs={12} md={4}>
                    <CategoryBarChart
                        data={breakdown}
                        title="Decision Breakdown"
                        subtitle="Processed inspection decisions"
                        loading={loading}
                        height={280}
                        barColor="#10b981"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default InspectorChartsWidget;
