import React from 'react';
import { Grid, Box } from '@mui/material';
import { useAdminDashboardContext } from '../State/AdminDashboardContext';
import StatusDonutChart from '@/Components/Charts/StatusDonutChart';
import TimeSeriesLineChart from '@/Components/Charts/TimeSeriesLineChart';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';

export const AdminChartsWidget: React.FC = () => {
    const { data, loading } = useAdminDashboardContext();

    const testsByStatus = data.testsByStatus || [];
    const testsOverTime = data.testsOverTime || [];
    const testsByLocation = (data.testsByLocation || []).map((loc) => ({
        name: loc.locationName,
        count: loc.count,
    }));

    return (
        <Box className="mb-6 flex justify-center">
            <Grid container spacing={3} justifyContent="center">
                {/* Volume Over Time */}
                <Grid item xs={12}>
                    <TimeSeriesLineChart
                        data={testsOverTime}
                        title="System Operations Volume"
                        subtitle="Operational test throughput overview"
                        loading={loading}
                        height={300}
                        color="#0284c7"
                    />
                </Grid>

                {/* Status Mix - Standalone Full-Width Line */}
                <Grid item xs={12}>
                    <StatusDonutChart
                        data={testsByStatus}
                        title="Status Mix Overview"
                        subtitle="Current system workflow status mix"
                        loading={loading}
                        height={300}
                    />
                </Grid>

                {/* Location Breakdown */}
                {testsByLocation.length > 0 && (
                    <Grid item xs={12}>
                        <CategoryBarChart
                            data={testsByLocation}
                            title="Operations by Location"
                            subtitle="Site activity breakdown across facility locations"
                            loading={loading}
                            height={280}
                            barColor="#6366f1"
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default AdminChartsWidget;
