import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    ListItemIcon,
    ListItemText,
    Chip,
    Tooltip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/Redux/Store/hook';
import { setDirection, setLanguage } from '@/Redux/Reducers/LanguageSlice/LanguageSlice';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

// Inline crisp SVG flags - Zero CDN dependency, offline-first & instantaneous rendering
export const UAEFlag: React.FC<{ size?: number }> = ({ size = 22 }) => (
    <svg width={size} height={Math.round(size * 0.65)} viewBox="0 0 1200 600" style={{ borderRadius: 3, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
        <rect width="1200" height="200" fill="#00732f" />
        <rect width="1200" height="200" y="200" fill="#ffffff" />
        <rect width="1200" height="200" y="400" fill="#000000" />
        <rect width="300" height="600" fill="#ff0000" />
    </svg>
);

export const UKFlag: React.FC<{ size?: number }> = ({ size = 22 }) => (
    <svg width={size} height={Math.round(size * 0.65)} viewBox="0 0 60 30" style={{ borderRadius: 3, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
        <clipPath id="uk-clip-s">
            <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id="uk-clip-t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <g clipPath="url(#uk-clip-s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-clip-t)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </g>
    </svg>
);

const languagesConfig = [
    {
        code: 'en',
        name: 'English',
        short: 'EN',
        direction: 'ltr' as const,
        flag: <UKFlag size={24} />,
    },
    {
        code: 'ar',
        name: 'العربية',
        short: 'AR',
        direction: 'rtl' as const,
        flag: <UAEFlag size={24} />,
    },
];

const LanguageDropdown: React.FC = () => {
    const { i18n, t } = useTranslation();
    const dispatch = useAppDispatch();
    const currentReduxLang = useAppSelector(state => state.languages.language);
    const dark = useAppSelector(state => state.theme.dark);

    const activeCode = (i18n.language || currentReduxLang || 'en').startsWith('ar') ? 'ar' : 'en';
    const currentLangObj = languagesConfig.find(l => l.code === activeCode) || languagesConfig[0];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelectLanguage = async (newCode: 'en' | 'ar') => {
        handleClose();
        if (newCode === activeCode) return;

        const isRtl = newCode === 'ar';
        const newDirection = isRtl ? 'rtl' : 'ltr';

        // 1. Update i18next & localStorage
        await i18n.changeLanguage(newCode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', newCode);
            document.cookie = `locale=${newCode}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.dir = newDirection;
            document.documentElement.lang = newCode;
        }

        // 2. Update Redux store
        dispatch(setLanguage(newCode));
        dispatch(setDirection(newDirection));

        // 3. Post to backend to sync session & cookie
        try {
            await axios.post(`/locale/${newCode}`);
        } catch {
            // Safe fallback if network is offline
        }

        // 4. Update page URL prefix smoothly
        const currentPath = window.location.pathname;
        let newPath = currentPath;

        if (currentPath.startsWith('/en/') || currentPath === '/en') {
            newPath = currentPath.replace(/^\/en/, `/${newCode}`);
        } else if (currentPath.startsWith('/ar/') || currentPath === '/ar') {
            newPath = currentPath.replace(/^\/ar/, `/${newCode}`);
        } else {
            newPath = `/${newCode}${currentPath.startsWith('/') ? currentPath : '/' + currentPath}`;
        }

        router.visit(newPath, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    };

    return (
        <Box>
            <Tooltip title={t('header.language') || 'Language'}>
                <IconButton
                    onClick={handleClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.6,
                        borderRadius: 2,
                        backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        '&:hover': {
                            backgroundColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        },
                    }}
                >
                    {currentLangObj.flag}
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: dark ? '#f1f5f9' : '#1e293b',
                            fontSize: '0.75rem',
                        }}
                    >
                        {currentLangObj.short}
                    </Typography>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: activeCode === 'ar' ? 'left' : 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: activeCode === 'ar' ? 'left' : 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 190,
                        borderRadius: 2.5,
                        backgroundColor: dark ? '#1e293b' : '#ffffff',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        boxShadow: dark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    },
                }}
            >
                {languagesConfig.map(lang => {
                    const isSelected = lang.code === activeCode;
                    return (
                        <MenuItem
                            key={lang.code}
                            onClick={() => handleSelectLanguage(lang.code as 'en' | 'ar')}
                            selected={isSelected}
                            sx={{
                                py: 1.25,
                                px: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                '&.Mui-selected': {
                                    backgroundColor: dark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                    fontWeight: 700,
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {lang.flag}
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: dark ? '#f8fafc' : '#0f172a' }}>
                                        {lang.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                        {lang.code === 'ar' ? 'UAE - العربية' : 'UK - English'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    label={lang.short}
                                    size="small"
                                    variant={isSelected ? 'filled' : 'outlined'}
                                    color={isSelected ? 'primary' : 'default'}
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                />
                                {isSelected && (
                                    <CheckIcon color="primary" sx={{ fontSize: 18 }} />
                                )}
                            </Box>
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
};

export default LanguageDropdown;
