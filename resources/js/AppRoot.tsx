import { PropsWithChildren, useEffect, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/Redux/Store/hook";
import { setDirection, setLanguage } from "@/Redux/Reducers/LanguageSlice/LanguageSlice";
import { createTheme, ThemeProvider } from "@mui/material";
import { green, lightGreen, pink, red } from "@mui/material/colors";
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import LatoBold from "../fonts/Lato-Bold.ttf";
import LatoRegular from "../fonts/Lato-Regular.ttf";

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
    key: 'muiltr',
});

const AppRoot = ({ children }: PropsWithChildren) => {
    const pageProps = usePage()?.props as any;
    const { i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const themeMode = useAppSelector(state => state.theme.mode);
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);

    const targetLang: 'ar' | 'en' =
        (pageProps?.lang === 'ar' || pageProps?.lang === 'en')
            ? pageProps.lang
            : (typeof window !== 'undefined' && (window.location.pathname.startsWith('/ar/') || window.location.pathname === '/ar'))
                ? 'ar'
                : (currentLang === 'ar' ? 'ar' : 'en');

    // Keep i18next, Redux, and document language strictly synchronized
    useEffect(() => {
        if (i18n && i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang);
        }
        if (currentLang !== targetLang) {
            dispatch(setLanguage(targetLang));
        }
        const targetDir = targetLang === 'ar' ? 'rtl' : 'ltr';
        if (direction !== targetDir) {
            dispatch(setDirection(targetDir));
        }
    }, [targetLang, currentLang, direction, i18n, dispatch]);

    const isRtl =
        targetLang === 'ar' ||
        pageProps?.lang === 'ar' ||
        direction === 'rtl' ||
        currentLang === 'ar' ||
        (i18n?.language && i18n.language.startsWith('ar')) ||
        (typeof window !== 'undefined' && (
            window.location.pathname.startsWith('/ar/') ||
            window.location.pathname === '/ar' ||
            document.documentElement.dir === 'rtl' ||
            document.documentElement.lang === 'ar'
        ));

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
            document.documentElement.lang = isRtl ? 'ar' : 'en';
        }
    }, [isRtl]);

    const theme = useMemo(() => createTheme({
        direction: isRtl ? 'rtl' : 'ltr',
        palette: {
            mode: themeMode,
            ...(dark ? {
                primary: {
                    main: '#3d5afe',
                },
                secondary: {
                    main: '#009688',
                },
                info: {
                    main: green[900],
                },
                text: {
                    primary: '#fafafa',
                },
                action: {
                    active: '#fafafa',
                },
                background: {
                    default: '#1f2937',
                    paper: '#1f2937',
                },
                activate: {
                    main: lightGreen["A400"],
                },
                deactivate: {
                    main: pink["A400"],
                },
            } : {
                primary: {
                    main: '#2a3eb1',
                },
                secondary: {
                    main: '#357a38',
                },
                info: {
                    main: green[900],
                },
                text: {
                    primary: '#374151',
                },
                action: {
                    active: '#374151',
                },
                background: {
                    default: '#d4d4d4',
                    paper: '#d4d4d4',
                },
                activate: {
                    main: green[700],
                },
                deactivate: {
                    main: red[900],
                },
            })
        },
        typography: {
            fontFamily: isRtl
                ? "'Segoe UI', 'Cairo', 'Tahoma', 'Arial', sans-serif"
                : "'Lato', sans-serif",
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: `
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: url(${LatoRegular}) format('ttf');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }

        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-display: swap;
          font-weight: 700;
          src: url(${LatoBold}) format('ttf');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        direction: isRtl ? 'rtl' : 'ltr',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    },
                    startIcon: {
                        margin: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    },
                    endIcon: {
                        margin: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    },
                },
            },
        },
    }), [themeMode, dark, isRtl]);

    return (
        <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
};

export default AppRoot;
