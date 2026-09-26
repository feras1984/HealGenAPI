import React from 'react';
import { Grid, Box } from '@mui/material';
import { useMonitorContext } from '../State/MonitorContext';
import StatusDonutChart from '@/Components/Charts/StatusDonutChart';
import TimeSeriesLineChart from '@/Components/Charts/TimeSeriesLineChart';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';

export const MonitorChartsWidget: React.FC = () => {
    const { data, loading } = useMonitorContext();

    const testsByStatus = data.testsByStatus || [];
    const testsOverTime = data.testsOverTime || [];
    const testsByLocation = (data.testsByLocation || []).map((loc) => ({
        name: loc.locationName,
        count: loc.count,
    }));
    const testsByDevice = (data.testsByDevice || []).map((dev) => ({
        name: dev.deviceName,
        count: dev.count,
        subtext: `${dev.deviceCode} - ${dev.locationName}`,
    }));

    return (
        <Box className="mb-6 flex justify-center">
            <Grid container spacing={3} justifyContent="center">
                {/* Tests Over Time (Line Chart) */}
                <Grid item xs={12}>
                    <TimeSeriesLineChart
                        data={testsOverTime}
                        title="Processing Volume Over Time"
                        subtitle="Real-time test volume progression"
                        loading={loading}
                        height={320}
                        color="#3b82f6"
                    />
                </Grid>

                {/* Status Distribution (Donut Chart) - Separate Full-Width Line */}
                <Grid item xs={12}>
                    <StatusDonutChart
                        data={testsByStatus}
                        title="Status Distribution"
                        subtitle="Workflow test state breakdown"
                        loading={loading}
                        height={420}
                    />
                </Grid>

                {/* Tests by Location (Bar Chart) */}
                <Grid item xs={12} md={6}>
                    <CategoryBarChart
                        data={testsByLocation}
                        title="Test Volume by Location"
                        subtitle="Location-level result throughput"
                        loading={loading}
                        height={300}
                        barColor="#6366f1"
                    />
                </Grid>

                {/* Top Devices throughput (Bar Chart) */}
                <Grid item xs={12} md={6}>
                    <CategoryBarChart
                        data={testsByDevice}
                        title="Top Device Throughput"
                        subtitle="Device-level result throughput"
                        loading={loading}
                        height={300}
                        barColor="#0ea5e9"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default MonitorChartsWidget;
