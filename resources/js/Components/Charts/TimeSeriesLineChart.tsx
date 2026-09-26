import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Box } from '@mui/material';
import ChartCard from './ChartCard';
import { useAppSelector } from '@/Redux/Store/hook';

export interface TimePoint {
    period: string;
    count: number;
}

interface TimeSeriesLineChartProps {
    data: TimePoint[];
    title?: string;
    subtitle?: string;
    loading?: boolean;
    height?: number;
    color?: string;
}

export const TimeSeriesLineChart: React.FC<TimeSeriesLineChartProps> = ({
    data,
    title = 'Tests Over Time',
    subtitle = 'Test processing volume trends',
    loading = false,
    height = 320,
    color = '#3b82f6',
}) => {
    const dark = useAppSelector((state) => state.theme.dark);
    const isEmpty = !data || data.length === 0 || data.every((d) => d.count === 0);

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} empty={isEmpty} height={height}>
            <Box sx={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="timeSeriesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#e2e8f0'} />
                        <XAxis
                            dataKey="period"
                            stroke={dark ? '#94a3b8' : '#64748b'}
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke={dark ? '#94a3b8' : '#64748b'}
                            fontSize={12}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: dark ? '#1e293b' : '#ffffff',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                color: dark ? '#f8fafc' : '#0f172a',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                            itemStyle={{ color: dark ? '#f8fafc' : '#0f172a' }}
                            labelStyle={{ color: dark ? '#f8fafc' : '#0f172a' }}
                            formatter={(value: number) => [`${value} Tests`, 'Volume']}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#timeSeriesGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </ChartCard>
    );
};

export default TimeSeriesLineChart;
