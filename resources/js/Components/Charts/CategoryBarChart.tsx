import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Box } from '@mui/material';
import ChartCard from './ChartCard';
import { useAppSelector } from '@/Redux/Store/hook';

export interface CategoryItem {
    name: string;
    count: number;
    subtext?: string;
}

interface CategoryBarChartProps {
    data: CategoryItem[];
    title: string;
    subtitle?: string;
    loading?: boolean;
    height?: number;
    barColor?: string;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
    data,
    title,
    subtitle,
    loading = false,
    height = 320,
    barColor = '#6366f1',
}) => {
    const dark = useAppSelector((state) => state.theme.dark);
    const isEmpty = !data || data.length === 0 || data.every((d) => d.count === 0);

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} empty={isEmpty} height={height}>
            <Box sx={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#e2e8f0'} />
                        <XAxis
                            dataKey="name"
                            stroke={dark ? '#94a3b8' : '#64748b'}
                            fontSize={11}
                            tickLine={false}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
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
                            formatter={(value: number, name: string, props: any) => [
                                `${value} Tests`,
                                props.payload.subtext ? `${props.payload.name} (${props.payload.subtext})` : props.payload.name,
                            ]}
                        />
                        <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={45}>
                            {data.map((_, index) => (
                                <Cell key={`bar-cell-${index}`} fill={barColor} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </ChartCard>
    );
};

export default CategoryBarChart;
