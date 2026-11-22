import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { TestResultSummary } from "@/Utils/TestResultSummaryHelper";
import { useTranslation } from "react-i18next";

interface ResultSummaryChipProps {
    summary: TestResultSummary;
    onClick?: (e: React.MouseEvent) => void;
    size?: 'small' | 'medium';
}

const ResultSummaryChip: React.FC<ResultSummaryChipProps> = ({
    summary,
    onClick,
    size = 'small',
}) => {
    const { t } = useTranslation();

    let label = t('tests.noResults') || 'No Results';
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let variant: 'filled' | 'outlined' = 'outlined';
    let icon = <RemoveCircleOutlineIcon sx={{ fontSize: '15px !important' }} />;

    if (summary.status === 'positive') {
        label = t('tests.positiveCount', { count: summary.positiveCount }) || `${summary.positiveCount} Positive`;
        color = 'error';
        variant = 'filled';
        icon = <ErrorOutlineIcon sx={{ fontSize: '15px !important' }} />;
    } else if (summary.status === 'abnormal') {
        label = t('tests.abnormalCount', { count: summary.abnormalCount }) || `${summary.abnormalCount} Abnormal`;
        color = 'warning';
        variant = 'filled';
        icon = <WarningAmberIcon sx={{ fontSize: '15px !important' }} />;
    } else if (summary.status === 'all_negative') {
        label = t('tests.allNegative') || 'All Negative';
        color = 'success';
        variant = 'outlined';
        icon = <CheckCircleOutlineIcon sx={{ fontSize: '15px !important' }} />;
    }

    const chip = (
        <Chip
            size={size}
            icon={icon}
            label={label}
            color={color}
            variant={variant}
            clickable={!!onClick}
            onClick={onClick}
            sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                cursor: onClick ? 'pointer' : 'default',
            }}
        />
    );

    if (!summary.hasFindings || summary.flaggedSubstances.length === 0) {
        return chip;
    }

    const tooltipContent = (
        <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                {t('tests.flaggedFindingsTooltip') || 'Flagged Substances:'}
            </Typography>
            {summary.flaggedSubstances.map((item, idx) => (
                <Typography key={`${item.substance}-${idx}`} variant="caption" sx={{ display: 'block' }}>
                    • {item.substance}: {item.softwareResult}
                    {item.visualResult && item.visualResult !== '-' && item.visualResult !== item.softwareResult
                        ? ` / ${item.visualResult}`
                        : ''}
                </Typography>
            ))}
        </Box>
    );

    return (
        <Tooltip title={tooltipContent} arrow placement="top">
            <span>{chip}</span>
        </Tooltip>
    );
};

export default ResultSummaryChip;
