import React, { useState } from "react";
import styles from "./styles.module.scss";
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import SidebarList, { CustomTab } from "./SidebarList";
import Icon from "@/Components/Icon/Icon";
import { Box, Typography, Divider } from "@mui/material";
import { Link, usePage, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const tabKeyMap: Record<string, string> = {
    'Home': 'nav.home',
    'Monitor': 'nav.monitor',
    'Inspector Queue': 'nav.inspectorQueue',
    'Supervisor Queue': 'nav.supervisorQueue',
    'Tests': 'nav.tests',
    'Users': 'nav.users',
    'Audit Logs': 'nav.auditLogs',
    'Locations': 'nav.locations',
    'Inspector Assignments': 'nav.inspectorAssignments',
    'Devices': 'nav.devices',
    'Device Types': 'nav.deviceTypes',
    'Device Assignments': 'nav.deviceAssignments',
};

const Sidebar: React.FC<{ expand: boolean }> = ({ expand }) => {
    const appName = import.meta.env.VITE_APP_NAME || 'HealGen Diagnostics';
    const { t, i18n } = useTranslation();
    const currentReduxLang = useAppSelector(state => state.languages.language);
    const direction = useAppSelector(state => state.languages.direction);
    const activeLang = (i18n.language || currentReduxLang || 'en').startsWith('ar') ? 'ar' : 'en';
    const isRtl = direction === 'rtl' || activeLang === 'ar';

    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || 'administrator').toLowerCase();

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const getLocalizedLink = (link: string): string => {
        if (!link) return '/';
        const cleanPath = link.replace(/^\/(en|ar)(\/|$)/, '/');
        if (cleanPath === '' || cleanPath === '/') {
            return `/${activeLang}`;
        }
        return `/${activeLang}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    };

    const filterTabsByRole = (tabs: CustomTab[], role: string): CustomTab[] => {
        return tabs
            .filter(tab => {
                if (role === 'administrator') return true;
                if (!tab.roles || tab.roles.length === 0) return true;
                return tab.roles.includes(role);
            })
            .map(tab => ({
                ...tab,
                children: tab.children ? filterTabsByRole(tab.children, role) : []
            }));
    };

    const allowedTabs = filterTabsByRole(SidebarList, userRole);

    const generateTabs = (tabs: CustomTab[], level = 0) => {
        const paddingStart = isRtl
            ? { pr: 1.5 + level * 1.5, pl: 1.5 }
            : { pl: 1.5 + level * 1.5, pr: 1.5 };

        return tabs.map((tab, index) => {
            const [open, setOpen] = useState<boolean>(false);
            const handleClick = () => {
                setOpen(prev => !prev);
            };

            const translatedName = t(tabKeyMap[tab.name] || tab.name);
            const hasChildren = tab.children && tab.children.length > 0;

            const buttonSx = {
                ...paddingStart,
                borderRadius: 1.5,
                my: 0.25,
                width: '100%',
                direction: isRtl ? 'rtl' : 'ltr',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: isRtl ? 'right' : 'left',
            };

            return (
                <Box key={index} sx={{ width: '100%', direction: isRtl ? 'rtl' : 'ltr' }}>
                    {!hasChildren ? (
                        <Link
                            href={getLocalizedLink(tab.link)}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'block',
                                width: '100%',
                                direction: isRtl ? 'rtl' : 'ltr',
                            }}
                        >
                            <ListItemButton sx={buttonSx}>
                                <ListItemIcon
                                    sx={{
                                        minWidth: 36,
                                        color: 'inherit',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        ...(isRtl ? { ml: 1.5, mr: 0 } : { mr: 1.5, ml: 0 }),
                                    }}
                                >
                                    <Icon name={tab.icon}></Icon>
                                </ListItemIcon>
                                <ListItemText
                                    primary={translatedName}
                                    sx={{
                                        m: 0,
                                        direction: isRtl ? 'rtl' : 'ltr',
                                        textAlign: isRtl ? 'right' : 'left',
                                    }}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        textAlign: isRtl ? 'right' : 'left',
                                    }}
                                />
                            </ListItemButton>
                        </Link>
                    ) : (
                        <>
                            <ListItemButton onClick={handleClick} sx={buttonSx}>
                                <ListItemIcon
                                    sx={{
                                        minWidth: 36,
                                        color: 'inherit',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        ...(isRtl ? { ml: 1.5, mr: 0 } : { mr: 1.5, ml: 0 }),
                                    }}
                                >
                                    <Icon name={tab.icon}></Icon>
                                </ListItemIcon>
                                <ListItemText
                                    primary={translatedName}
                                    sx={{
                                        m: 0,
                                        direction: isRtl ? 'rtl' : 'ltr',
                                        textAlign: isRtl ? 'right' : 'left',
                                    }}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        textAlign: isRtl ? 'right' : 'left',
                                    }}
                                />
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, ...(isRtl ? { mr: 'auto', ml: 0 } : { ml: 'auto', mr: 0 }) }}>
                                    <Icon name={open ? 'expand-more' : (isRtl ? 'chevron-left' : 'chevron-right')}></Icon>
                                </Box>
                            </ListItemButton>

                            <Collapse in={open} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding sx={{ width: '100%', direction: isRtl ? 'rtl' : 'ltr' }}>
                                    {generateTabs(tab.children, level + 1)}
                                </List>
                            </Collapse>
                        </>
                    )}
                </Box>
            );
        });
    };

    return (
        <List
            sx={{
                width: '100%',
                bgcolor: 'background.paper',
                direction: isRtl ? 'rtl' : 'ltr',
                textAlign: isRtl ? 'right' : 'left',
                p: 0,
            }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
                <>
                    <ListSubheader
                        component="div"
                        id="nested-list-subheader"
                        sx={{
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            direction: isRtl ? 'rtl' : 'ltr',
                            textAlign: isRtl ? 'right' : 'left',
                            justifyContent: isRtl ? 'flex-start' : 'flex-start',
                            px: 1.5,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                width: '100%',
                                textAlign: isRtl ? 'right' : 'left',
                            }}
                        >
                            {t('common.appName') || appName}
                        </Typography>
                    </ListSubheader>
                    <Divider />
                </>
            }
        >
            {generateTabs(allowedTabs)}
            <Divider sx={{ my: 1 }} />
            <ListItemButton
                onClick={handleLogout}
                sx={{
                    px: 1.5,
                    borderRadius: 1.5,
                    my: 0.25,
                    width: '100%',
                    direction: isRtl ? 'rtl' : 'ltr',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    textAlign: isRtl ? 'right' : 'left',
                    color: 'error.main',
                }}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 36,
                        color: 'error.main',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        ...(isRtl ? { ml: 1.5, mr: 0 } : { mr: 1.5, ml: 0 }),
                    }}
                >
                    <Icon name="logout"></Icon>
                </ListItemIcon>
                <ListItemText
                    primary={t('common.logout') || 'Logout'}
                    sx={{
                        m: 0,
                        direction: isRtl ? 'rtl' : 'ltr',
                        textAlign: isRtl ? 'right' : 'left',
                    }}
                    primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textAlign: isRtl ? 'right' : 'left',
                    }}
                />
            </ListItemButton>
        </List>
    );
};

export default Sidebar;
