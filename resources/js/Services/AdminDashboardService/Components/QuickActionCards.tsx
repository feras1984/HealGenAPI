import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Button } from '@mui/material';
import { Link } from '@inertiajs/react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useAppSelector } from "@/Redux/Store/hook";

const QuickActionCards: React.FC = () => {
    const dark = useAppSelector(state => state.theme.dark);

    const actions = [
        {
            title: 'Operational Monitor',
            desc: 'View real-time test & device operations',
            icon: <DashboardIcon color="primary" fontSize="large" />,
            link: '/monitor',
            btnText: 'Open Monitor',
            color: 'primary' as const,
        },
        {
            title: 'Inspector Queue',
            desc: 'Inspect pending HealGen test results',
            icon: <AssignmentIcon color="warning" fontSize="large" />,
            link: '/inspector/dashboard',
            btnText: 'Open Inspector Queue',
            color: 'warning' as const,
        },
        {
            title: 'Supervisor Queue',
            desc: 'Review, confirm & dispatch to HIS',
            icon: <VerifiedIcon color="secondary" fontSize="large" />,
            link: '/supervisor/dashboard',
            btnText: 'Open Supervisor Queue',
            color: 'secondary' as const,
        },
        {
            title: 'Manage Locations',
            desc: 'Configure testing sites & locations',
            icon: <LocationOnIcon color="info" fontSize="large" />,
            link: '/locations',
            btnText: 'Manage Locations',
            color: 'info' as const,
        },
        {
            title: 'Manage Devices',
            desc: 'Register devices & assignments',
            icon: <DevicesIcon color="success" fontSize="large" />,
            link: '/devices',
            btnText: 'Manage Devices',
            color: 'success' as const,
        },
        {
            title: 'Manage Users',
            desc: 'User account roles & permissions',
            icon: <PeopleIcon color="error" fontSize="large" />,
            link: '/users',
            btnText: 'Manage Users',
            color: 'error' as const,
        },
    ];

    return (
        <Box className="mb-6">
            <Typography variant="h6" color="text.primary" className="mb-3 font-semibold">
                Administrative Quick Navigation
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                {actions.map((act, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                backgroundColor: dark ? 'var(--clr-bg-content-dark, #334155)' : '#ffffff',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box className="flex items-center space-x-3 mb-2">
                                    {act.icon}
                                    <Typography variant="h6" color="text.primary" className="font-semibold">
                                        {act.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" className="mb-4">
                                    {act.desc}
                                </Typography>
                                <Button
                                    component={Link}
                                    href={act.link}
                                    variant="outlined"
                                    color={act.color}
                                    size="small"
                                    fullWidth
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                                >
                                    {act.btnText}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default QuickActionCards;
