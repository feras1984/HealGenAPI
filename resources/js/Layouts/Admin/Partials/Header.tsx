import React from "react";
import Account from "@/Components/Account/Account";
import styles from "./styles.module.scss";
import MenuIcon from '@mui/icons-material/Menu';
import { useAppSelector, useAppDispatch } from "@/Redux/Store/hook";
import { setMode } from "@/Redux/Reducers/ThemeSlice/ThemeSlice";
import LanguageDropdown from "@/Layouts/Admin/Partials/LanguageDropdown";
import { IconButton, Box } from "@mui/material";
import Icon from "@/Components/Icon/Icon";
import { useTranslation } from "react-i18next";
import { usePage } from "@inertiajs/react";

const Header: React.FC<{ handleExpand: () => void }> = ({ handleExpand }) => {
    const dispatch = useAppDispatch();
    const pageProps = usePage()?.props as any;
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentReduxLang = useAppSelector(state => state.languages.language);
    const { i18n } = useTranslation();
    const isRtl =
        pageProps?.lang === 'ar' ||
        direction === 'rtl' ||
        currentReduxLang === 'ar' ||
        (i18n?.language && i18n.language.startsWith('ar')) ||
        (typeof window !== 'undefined' && (
            window.location.pathname.startsWith('/ar/') ||
            window.location.pathname === '/ar' ||
            document.documentElement.dir === 'rtl' ||
            document.documentElement.lang === 'ar'
        ));

    const handleTheme = () => {
        dark ? dispatch(setMode(false)) : dispatch(setMode(true));
    };

    const handleIconClass = () => (
        dark ? styles.iconDark : styles.iconLight
    );

    return (
        <Box
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '100%',
                padding: '0 16px',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            {/* Nav Group 1: Sidebar Toggle Icon + Logos (Right in RTL, Left in LTR) */}
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <IconButton onClick={() => handleExpand()} size="medium">
                    <MenuIcon className={handleIconClass()}/>
                </IconButton>
                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <img
                        src="/images/logo-1.png"
                        alt="Logo 1"
                        style={{ maxHeight: '30px', width: 'auto', objectFit: 'contain' }}
                    />
                    <img
                        src="/images/logo-2.png"
                        alt="Logo 2"
                        style={{ maxHeight: '30px', width: 'auto', objectFit: 'contain' }}
                    />
                </Box>
            </Box>

            {/* Nav Group 2: Actions & Account (Left in RTL, Right in LTR) */}
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <IconButton onClick={handleTheme}>
                    <Icon name={dark ? "light-mode" : "dark-mode"} />
                </IconButton>
                <IconButton>
                    <Icon name="notification-mui" />
                </IconButton>
                <IconButton>
                    <Icon name="mail-mui" />
                </IconButton>
                <LanguageDropdown />
                <Box style={{ marginInlineStart: '12px' }}>
                    <Account />
                </Box>
            </Box>
        </Box>
    );
};

export default Header;
