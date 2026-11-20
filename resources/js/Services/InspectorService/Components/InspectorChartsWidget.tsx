import React from 'react';
import { Grid, Box } from '@mui/material';
import { useInspectorContext } from '../State/InspectorContext';
import ActionActivityChart from '@/Components/Charts/ActionActivityChart';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';
import { useTranslation } from "react-i18next";

export const InspectorChartsWidget: React.FC = () => {
    const { data, loading } = useInspectorContext();
    const { t } = useTranslation();

    const chartData = data.activityChart;
    const trend = chartData?.trend || [];
    const breakdown = (chartData?.breakdown || []).map((b) => {
        const isRetest = b.name === 'Rejected' || b.name === 'Retest';
        const isForward = b.name === 'Accepted' || b.name === 'Forwarded';
        return {
            name: isForward
                ? (t('inspector.forwarded') || t('status.Accepted') || 'Forwarded')
                : isRetest
                ? (t('inspector.retest') || t('status.Rejected') || 'Retest')
                : (t(`status.${b.name}`) || b.name),
            count: b.count,
            color: isRetest ? '#f97316' : '#10b981',
        };
    });

    return (
        <Box className="mb-6 flex justify-center">
            <Grid container spacing={3} justifyContent="center">
                {/* Decision Trend Chart */}
                <Grid item xs={12} md={8}>
                    <ActionActivityChart
                        data={trend}
                        title={t('inspector.activityTrend') || "Inspection Decision Activity Trend"}
                        subtitle={t('inspector.hourlyTrendSubtitle') || "Hourly forwarded vs retest decisions today"}
                        loading={loading}
                        height={280}
                        primaryKey="accepted"
                        primaryLabel={t('inspector.forwarded') || t('status.Accepted') || "Forwarded"}
                        secondaryLabel={t('inspector.retest') || t('status.Rejected') || "Retest"}
                        primaryColor="#10b981"
                        secondaryColor="#f97316"
                    />
                </Grid>

                {/* Decision Breakdown */}
                <Grid item xs={12} md={4}>
                    <CategoryBarChart
                        data={breakdown}
                        title={t('inspector.decisionBreakdown') || "Decision Breakdown"}
                        subtitle={t('inspector.breakdownSubtitle') || "Processed inspection decisions"}
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
