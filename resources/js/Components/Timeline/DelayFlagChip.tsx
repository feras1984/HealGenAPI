import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { WorkflowDelaySummary, WorkflowStageDelay } from "@/models/patient/PatientHeader";
import { useTranslation } from "react-i18next";

export function getDelayStatusLabel(
    delaySummary: WorkflowDelaySummary | null | undefined,
    t: (key: string, opts?: any) => string
): string {
    if (!delaySummary || !delaySummary.hasDelay) {
        return t('delay.onTime') || 'On Time';
    }
    if (delaySummary.maxDelayFormatted) {
        return t('delay.delayedDuration', { duration: delaySummary.maxDelayFormatted }) || `Delayed (${delaySummary.maxDelayFormatted})`;
    }
    return t('delay.delayed') || 'Delayed';
}

export function applyDelayedRowAccent(args: any, isRtl: boolean, dark: boolean): void {
    if (!args?.row || !args?.data?.delaySummary?.hasDelay) return;

    const row = args.row as HTMLElement;
    row.style.backgroundColor = dark ? 'rgba(245, 158, 11, 0.10)' : 'rgba(245, 158, 11, 0.07)';

    const borderProp = isRtl ? 'borderRight' : 'borderLeft';
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
        const edgeCell = (isRtl ? cells[0] : cells[0]) as HTMLElement;
        edgeCell.style[borderProp] = '3px solid #f59e0b';
    }
}

interface DelayFlagChipProps {
    delaySummary?: WorkflowDelaySummary | null;
    onClick?: (e: React.MouseEvent) => void;
    size?: 'small' | 'medium';
    hideWhenOnTime?: boolean;
}

const DelayFlagChip: React.FC<DelayFlagChipProps> = ({
    delaySummary,
    onClick,
    size = 'small',
    hideWhenOnTime = false,
}) => {
    const { t } = useTranslation();

    const hasDelay = !!delaySummary?.hasDelay;

    if (!hasDelay && hideWhenOnTime) {
        return null;
    }

    const stageEntries: Array<{ label: string; stage: WorkflowStageDelay }> = [];
    if (delaySummary?.stages?.captureToReceive) {
        stageEntries.push({
            label: t('delay.captureToReceive') || 'Captured → Received',
            stage: delaySummary.stages.captureToReceive,
        });
    }
    if (delaySummary?.stages?.receiveToInspection) {
        stageEntries.push({
            label: t('delay.receiveToInspection') || 'Received → Inspection',
            stage: delaySummary.stages.receiveToInspection,
        });
    }
    if (delaySummary?.stages?.inspectionToSupervision) {
        stageEntries.push({
            label: t('delay.inspectionToSupervision') || 'Inspection → Expert Review',
            stage: delaySummary.stages.inspectionToSupervision,
        });
    }

    const label = hasDelay
        ? (delaySummary?.maxDelayFormatted
            ? (t('delay.delayedDuration', { duration: delaySummary.maxDelayFormatted }) || `Delayed (${delaySummary.maxDelayFormatted})`)
            : (t('delay.delayed') || 'Delayed'))
        : (t('delay.onTime') || 'On Time');

    const chip = (
        <Chip
            size={size}
            icon={
                hasDelay
                    ? <ScheduleIcon sx={{ fontSize: '15px !important' }} />
                    : <CheckCircleOutlineIcon sx={{ fontSize: '15px !important' }} />
            }
            label={label}
            color={hasDelay ? 'warning' : 'success'}
            variant={hasDelay ? 'filled' : 'outlined'}
            clickable={!!onClick}
            onClick={onClick}
            sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                cursor: onClick ? 'pointer' : 'default',
            }}
        />
    );

    if (stageEntries.length === 0) {
        return chip;
    }

    const threshold = delaySummary?.thresholdHours ?? 48;

    const tooltipContent = (
        <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                {t('delay.stageTimingsTooltip', { hours: threshold }) || `Stage Timings (Threshold: ${threshold}h):`}
            </Typography>
            {stageEntries.map(({ label: stageLabel, stage }) => (
                <Typography
                    key={stage.key}
                    variant="caption"
                    sx={{
                        display: 'block',
                        color: stage.isDelayed ? '#fbbf24' : 'inherit',
                        fontWeight: stage.isDelayed ? 700 : 400,
                    }}
                >
                    • {stageLabel}: {stage.formatted}
                    {stage.isOngoing ? ` (${t('delay.waiting') || 'waiting'})` : ''}
                    {stage.isDelayed ? ` — >${threshold}h` : ''}
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

export default DelayFlagChip;
