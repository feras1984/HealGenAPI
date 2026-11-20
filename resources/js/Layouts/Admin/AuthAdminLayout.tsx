import React, { PropsWithChildren, ReactNode } from "react";
import { Box } from "@mui/material";
import { useAppSelector } from "@/Redux/Store/hook";
import AppRoot from "@/AppRoot";
import LanguageDropdown from "@/Layouts/Admin/Partials/LanguageDropdown";

const AuthAdminLayout = ({ children }: PropsWithChildren<{ header?: ReactNode }>) => {
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl =
        direction === 'rtl' ||
        currentLang === 'ar' ||
        (typeof window !== 'undefined' && (
            window.location.pathname.startsWith('/ar/') ||
            window.location.pathname === '/ar' ||
            document.documentElement.dir === 'rtl' ||
            document.documentElement.lang === 'ar'
        ));

    return (
        <AppRoot>
            <Box
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`min-h-screen flex flex-col justify-center items-center relative ${dark ? 'dark' : 'light'}`}
                sx={{
                    backgroundColor: dark ? '#0f172a' : '#f1f5f9',
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
