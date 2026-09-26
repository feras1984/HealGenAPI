import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Box } from '@mui/material';
import ChartCard from './ChartCard';
import { useAppSelector } from '@/Redux/Store/hook';

export interface StatusItem {
    status: string;
    count: number;
}

interface StatusDonutChartProps {
    data: StatusItem[];
    title?: string;
    subtitle?: string;
    loading?: boolean;
    height?: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Imported': '#3b82f6',
    'Awaiting Inspection': '#f59e0b',
    'Inspector Accepted': '#10b981',
    'Inspector Rejected': '#ef4444',
    'Awaiting Supervisor': '#8b5cf6',
    'Confirmed': '#059669',
    'Supervisor Rejected': '#dc2626',
    'Failed': '#6b7280',
    'Blocked': '#4b5563',
    'SentToHIS': '#0284c7',
    'FailedToSend': '#b91c1c',
};

const DEFAULT_COLOR = '#64748b';

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
    data,
    title = 'Status Distribution',
    subtitle = 'Distribution of workflow test statuses',
    loading = false,
    height = 360,
}) => {
    const dark = useAppSelector((state) => state.theme.dark);

    const chartData = data.filter((item) => item.count > 0);
    const totalCount = chartData.reduce((acc, curr) => acc + curr.count, 0);
    const isEmpty = chartData.length === 0;

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} empty={isEmpty} height={height}>
            <Box sx={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={3}
                            labelLine={{ stroke: dark ? '#94a3b8' : '#64748b', strokeWidth: 1.5 }}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={STATUS_COLORS[entry.status] || DEFAULT_COLOR}
                                    stroke={dark ? '#1e293b' : '#ffffff'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: dark ? '#1e293b' : '#ffffff',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                color: dark ? '#f8fafc' : '#0f172a',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                fontWeight: 600,
                            }}
                            itemStyle={{ color: dark ? '#f8fafc' : '#0f172a' }}
                            labelStyle={{ color: dark ? '#f8fafc' : '#0f172a' }}
                            formatter={(value: number, name: string) => {
                                const pct = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : '0';
                                return [`${value} Tests (${pct}%)`, name];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="circle"
                            formatter={(value, entry: any) => {
                                const count = entry?.payload?.count ?? 0;
                                const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : '0';
                                return (
                                    <span style={{ color: dark ? '#e2e8f0' : '#1e293b', fontSize: '0.875rem', fontWeight: 600, paddingRight: '12px' }}>
                                        {value}: <span style={{ color: dark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{count}</span> ({pct}%)
                                    </span>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </ChartCard>
    );
};

export default StatusDonutChart;
