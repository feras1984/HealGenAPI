import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Box } from '@mui/material';
import ChartCard from './ChartCard';
import { useAppSelector } from '@/Redux/Store/hook';

export interface ActionTrendPoint {
    period: string;
    accepted?: number;
    confirmed?: number;
    rejected: number;
}

interface ActionActivityChartProps {
    data: ActionTrendPoint[];
    title: string;
    subtitle?: string;
    loading?: boolean;
    height?: number;
    primaryLabel?: 'Accepted' | 'Confirmed';
    primaryColor?: string;
    secondaryColor?: string;
}

export const ActionActivityChart: React.FC<ActionActivityChartProps> = ({
    data,
    title,
    subtitle,
    loading = false,
    height = 320,
    primaryLabel = 'Accepted',
    primaryColor = '#10b981',
    secondaryColor = '#ef4444',
}) => {
    const dark = useAppSelector((state) => state.theme.dark);
    const primaryKey = primaryLabel.toLowerCase();

    const isEmpty = !data || data.length === 0 || data.every(
        (d: any) => (d[primaryKey] || 0) === 0 && d.rejected === 0
    );

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} empty={isEmpty} height={height}>
            <Box sx={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#e2e8f0'} />
                        <XAxis
                            dataKey="period"
                            stroke={dark ? '#94a3b8' : '#64748b'}
                            fontSize={11}
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
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => (
                                <span style={{ color: dark ? '#94a3b8' : '#475569', fontSize: '0.825rem' }}>
                                    {value}
                                </span>
                            )}
                        />
                        <Bar
                            dataKey={primaryKey}
                            name={primaryLabel}
                            fill={primaryColor}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey="rejected"
                            name="Rejected"
                            fill={secondaryColor}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </ChartCard>
    );
};

export default ActionActivityChart;
