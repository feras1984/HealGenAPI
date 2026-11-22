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
import { useTranslation } from "react-i18next";

const QuickActionCards: React.FC = () => {
    const dark = useAppSelector(state => state.theme.dark);
    const { t, i18n } = useTranslation();
    const activeLang = i18n.language === 'ar' ? 'ar' : 'en';
    const isRtl = activeLang === 'ar';

    const getLocalizedLink = (link: string): string => {
        const clean = link.replace(/^\/(en|ar)(\/|$)/, '/');
        return `/${activeLang}${clean.startsWith('/') ? clean : '/' + clean}`;
    };

    const actions = [
        {
            title: t('nav.monitor') || 'Operational Monitor',
            desc: isRtl ? 'متابعة العمليات والأجهزة في الوقت الفعلي' : 'View real-time test & device operations',
            icon: <DashboardIcon color="primary" fontSize="large" />,
            link: '/monitor',
            btnText: isRtl ? 'فتح شاشة المراقبة' : 'Open Monitor',
            color: 'primary' as const,
        },
        {
            title: t('nav.inspectorQueue') || 'Inspector Queue',
            desc: isRtl ? 'فحص نتائج عينات هيل جين المعلقة' : 'Inspect pending HealGen test results',
            icon: <AssignmentIcon color="warning" fontSize="large" />,
            link: '/inspector/dashboard',
            btnText: isRtl ? 'قائمة الفاحص' : 'Open Inspector Queue',
            color: 'warning' as const,
        },
        {
            title: t('nav.supervisorQueue') || 'Supervisor Queue',
            desc: isRtl ? 'المراجعة والاعتماد النهائي والإرسال للنظام الصحي' : 'Review, confirm & dispatch to HIS',
            icon: <VerifiedIcon color="secondary" fontSize="large" />,
            link: '/supervisor/dashboard',
            btnText: isRtl ? 'قائمة المشرف' : 'Open Supervisor Queue',
            color: 'secondary' as const,
        },
        {
            title: t('nav.locations') || 'Manage Locations',
            desc: isRtl ? 'إدارة وتكوين مراكز الفحص والمواقع' : 'Configure testing sites & locations',
            icon: <LocationOnIcon color="info" fontSize="large" />,
            link: '/locations',
            btnText: isRtl ? 'إدارة المواقع' : 'Manage Locations',
            color: 'info' as const,
        },
        {
            title: t('nav.devices') || 'Manage Devices',
            desc: isRtl ? 'تسجيل الأجهزة والتعيينات الطبية' : 'Register devices & assignments',
            icon: <DevicesIcon color="success" fontSize="large" />,
            link: '/devices',
            btnText: isRtl ? 'إدارة الأجهزة' : 'Manage Devices',
            color: 'success' as const,
        },
        {
            title: t('nav.users') || 'Manage Users',
            desc: isRtl ? 'إدارة الحسابات والأدوار والصلاحيات' : 'User account roles & permissions',
            icon: <PeopleIcon color="error" fontSize="large" />,
            link: '/users',
            btnText: isRtl ? 'إدارة المستخدمين' : 'Manage Users',
            color: 'error' as const,
        },
    ];

    return (
        <Box className="mb-6">
            <Typography variant="h6" color="text.primary" className="mb-3 font-semibold">
                {isRtl ? 'روابط التنقل الإداري السريع' : 'Administrative Quick Navigation'}
            </Typography>
            <Grid container spacing={2}>
                {actions.map((act, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                backgroundColor: dark ? 'var(--clr-bg-content-dark, #102B22)' : '#ffffff',
                                border: '1px solid',
                                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                borderRadius: 2,
                                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                                '&:hover': {
                                    boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.6)' : '0 4px 8px rgba(0,0,0,0.1)',
                                }
                            }}
                        >
                            <CardContent>
                                <Box className="flex items-center gap-3 mb-2">
                                    {act.icon}
                                    <Typography variant="h6" color="text.primary" className="font-semibold">
                                        {act.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" className="mb-3">
                                    {act.desc}
                                </Typography>
                                <Button
                                    component={Link}
                                    href={getLocalizedLink(act.link)}
                                    variant="outlined"
                                    color={act.color}
                                    size="small"
                                    fullWidth
                                    sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
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
