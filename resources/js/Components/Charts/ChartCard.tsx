import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton, Alert } from '@mui/material';
import { useAppSelector } from '@/Redux/Store/hook';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    loading = false,
    error = null,
    empty = false,
    emptyMessage = 'No chart data available for the selected filters.',
    children,
    action,
    height = 320,
}) => {
    const dark = useAppSelector((state) => state.theme.dark);

    return (
        <Card
            sx={{
                borderRadius: 2,
                backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                border: '1px solid',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, alignItems: 'center' }}>
                <Box className="flex flex-col items-center justify-center text-center mb-4 w-full">
                    <Typography variant="h6" color="text.primary" className="font-semibold">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                    {action && <Box className="mt-2">{action}</Box>}
                </Box>

                <Box sx={{ width: '100%', height: height, minHeight: typeof height === 'number' ? height : 220, position: 'relative' }}>
                    {loading ? (
                        <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: 2 }} />
                    ) : error ? (
                        <Box className="h-full w-full flex items-center justify-center">
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    ) : empty ? (
                        <Box className="h-full w-full flex items-center justify-center text-center p-4">
                            <Typography variant="body2" color="text.secondary">
                                {emptyMessage}
                            </Typography>
                        </Box>
                    ) : (
                        children
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ChartCard;
