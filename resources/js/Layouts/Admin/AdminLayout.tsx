import React, { PropsWithChildren, ReactNode, useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Box } from "@mui/material";
import styles from "@/Layouts/Admin/styles.module.scss";
import Sidebar from "@/Layouts/Admin/Partials/Sidebar";
import Header from "@/Layouts/Admin/Partials/Header";
import { useAppSelector, useAppDispatch } from "@/Redux/Store/hook";
import { setDirection, setLanguage } from "@/Redux/Reducers/LanguageSlice/LanguageSlice";
import AppRoot from "@/AppRoot";
import { getUser } from "@/Redux/Reducers/UserSlice/UserSlice";
import { useTranslation } from "react-i18next";

const AdminLayout = ({ children }: PropsWithChildren<{ header?: ReactNode }>) => {
    const [expand, setExpand] = useState<boolean>(false);
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentReduxLang = useAppSelector(state => state.languages.language);
    const dispatch = useAppDispatch();
    const pageProps = usePage().props as any;
    const { i18n } = useTranslation();

    // Sync language from Inertia page props if passed
    useEffect(() => {
        const propLang = pageProps.lang;
        if (propLang && (propLang === 'ar' || propLang === 'en')) {
            if (i18n.language !== propLang) {
                i18n.changeLanguage(propLang);
            }
            if (propLang !== currentReduxLang) {
                dispatch(setLanguage(propLang));
                dispatch(setDirection(propLang === 'ar' ? 'rtl' : 'ltr'));
            }
        }
    }, [pageProps.lang, currentReduxLang, i18n, dispatch]);

    const isRtl =
        pageProps?.lang === 'ar' ||
        direction === 'rtl' ||
        currentReduxLang === 'ar' ||
        (i18n.language && i18n.language.startsWith('ar')) ||
        (typeof window !== 'undefined' && (
            window.location.pathname.startsWith('/ar/') ||
            window.location.pathname === '/ar' ||
            document.documentElement.dir === 'rtl' ||
            document.documentElement.lang === 'ar'
        ));

    const handleExpand = () => {
        setExpand(prev => !prev);
    };

    if (pageProps?.auth?.user) {
        dispatch(getUser(pageProps.auth.user));
    }

    return (
        <AppRoot>
            <Box
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`${dark ? 'dark' : 'light'}`}
                sx={{
                    minHeight: '100vh',
                    position: 'relative',
                    ...(dark
                        ? {
                              bgcolor: '#04150F',
                              backgroundImage: 'linear-gradient(160deg, #04150F 0%, #082319 52%, #051A13 100%)',
                          }
                        : {
                              bgcolor: '#f9fafb',
                          }),
                }}
            >
                {/* Single Contextual Sliding Sidebar */}
                <Box
                    component="aside"
                    aria-label="Application Sidebar"
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`h-screen p-[16px] overflow-y-auto ${
                        isRtl
                            ? `${styles.sidebarRtl} ${expand ? styles.sidebarRtlOpen : styles.sidebarRtlClosed}`
                            : `${styles.sidebarLtr} ${expand ? styles.sidebarLtrOpen : styles.sidebarLtrClosed}`
                    }`}
                    sx={{
                        ...(dark
                            ? {
                                  bgcolor: '#041F16',
                                  backgroundImage: 'linear-gradient(180deg, #031A12 0%, #063323 55%, #042419 100%)',
                                  borderInlineEnd: '1px solid rgba(0, 168, 107, 0.22)',
                              }
                            : {
                                  bgcolor: 'background.paper',
                              }),
                        textAlign: isRtl ? 'right' : 'left',
                    }}
                >
                    <Sidebar expand={expand} />
                </Box>

                {/* Main Content Area with Smooth Dynamic Margin */}
                <Box
                    component="main"
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`grow ${
                        isRtl
                            ? (expand ? styles.contentRtlOpen : styles.contentRtlClosed)
                            : (expand ? styles.contentLtrOpen : styles.contentLtrClosed)
                    }`}
                    sx={{
                        width: 'auto',
                        minWidth: 0,
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        component="header"
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className={`h-[60px] ${styles.boxShadow} ${dark ? 'dark' : 'light'}`}
                        sx={{
                            ...(dark
                                ? {
                                      bgcolor: '#052218',
                                      backgroundImage: 'linear-gradient(90deg, #052218 0%, #083324 55%, #06281C 100%)',
                                      borderBottom: '2px solid #008658',
                                      color: '#f8fafc',
                                  }
                                : {
                                      bgcolor: '#ffffff',
                                      color: '#1e293b',
                                  }),
                            width: '100%',
                        }}
                    >
                        <Header handleExpand={handleExpand} />
                    </Box>

                    <Box component="div" className="content p-[16px] bg-scroll" sx={{ flexGrow: 1 }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </AppRoot>
    );
};

export default AdminLayout;
