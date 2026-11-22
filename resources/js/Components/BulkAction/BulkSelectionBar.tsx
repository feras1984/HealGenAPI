import React from 'react';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

export interface BulkSelectionBarProps {
    selectedCount: number;
    flaggedCount?: number;
    primaryLabel: string;
    primaryColor?: 'success' | 'primary' | 'warning' | 'error';
    onPrimaryAction: () => void;
    onClearSelection: () => void;
    disabled?: boolean;
}

const BulkSelectionBar: React.FC<BulkSelectionBarProps> = ({
    selectedCount,
    flaggedCount = 0,
    primaryLabel,
    primaryColor = 'success',
    onPrimaryAction,
    onClearSelection,
    disabled = false,
}) => {
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const { t, i18n } = useTranslation();
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    if (selectedCount === 0) return null;

    return (
        <Paper
            elevation={0}
            dir={isRtl ? 'rtl' : 'ltr'}
            sx={{
                mb: 2,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                backgroundColor: dark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid',
                borderColor: dark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
                <Chip
                    label={t('bulk.selectedCount', { count: selectedCount }) || `${selectedCount} selected`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                />
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {t('bulk.readyForAction') || 'Ready for bulk action'}
                </Typography>
                {flaggedCount > 0 && (
                    <Chip
                        icon={<WarningAmberIcon sx={{ fontSize: '15px !important' }} />}
                        label={
                            t('bulk.flaggedInSelection', { count: flaggedCount }) ||
                            `${flaggedCount} with positive/abnormal findings`
                        }
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={onClearSelection}
                    disabled={disabled}
                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                >
                    {t('bulk.clearSelection') || 'Clear Selection'}
                </Button>
                <Button
                    variant="contained"
                    color={primaryColor}
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={onPrimaryAction}
                    disabled={disabled}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                >
                    {primaryLabel}
                </Button>
            </Box>
        </Paper>
    );
};

export default BulkSelectionBar;
