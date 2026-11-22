import React, { PropsWithChildren, ReactNode } from "react";
import { Box } from "@mui/material";
import { usePage } from "@inertiajs/react";
import { useAppSelector } from "@/Redux/Store/hook";
import AppRoot from "@/AppRoot";
import LanguageDropdown from "@/Layouts/Admin/Partials/LanguageDropdown";

const AuthAdminLayout = ({ children }: PropsWithChildren<{ header?: ReactNode }>) => {
    const pageProps = usePage()?.props as any;
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const activeLang =
        pageProps?.lang === 'ar' || pageProps?.lang === 'en'
            ? pageProps.lang
            : (typeof window !== 'undefined' && (window.location.pathname.startsWith('/ar/') || window.location.pathname === '/ar'))
                ? 'ar'
                : (typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.pathname === '/en'))
                    ? 'en'
                    : (currentLang === 'ar' || direction === 'rtl' ? 'ar' : 'en');
    const isRtl = activeLang === 'ar';

    return (
        <AppRoot>
            <Box
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`min-h-screen flex flex-col justify-center items-center relative ${dark ? 'dark' : 'light'}`}
                sx={{
                    ...(dark
                        ? {
                              backgroundColor: '#02140E',
                              backgroundImage: 'linear-gradient(135deg, #02140E 0%, #005C3D 52%, #042419 100%)',
                          }
                        : {
                              backgroundColor: '#f1f5f9',
                          }),
                    p: 2,
                }}
            >
                {/* Floating language switcher at top corner */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: isRtl ? 'auto' : 16,
                        left: isRtl ? 16 : 'auto',
                        zIndex: 10,
                    }}
                >
                    <LanguageDropdown />
                </Box>

                <Box component="div" className="w-full max-w-md">
                    {children}
                </Box>
            </Box>
        </AppRoot>
    );
};

export default AuthAdminLayout;
