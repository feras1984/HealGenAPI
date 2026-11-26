import React from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import { TestHistoryEntry } from '@/models/patient/PatientHeader';
import { useAppSelector } from '@/Redux/Store/hook';
import { useTranslation } from 'react-i18next';

interface TestHistoryTimelineProps {
    history?: TestHistoryEntry[];
    compact?: boolean;
}

const TestHistoryTimeline: React.FC<TestHistoryTimelineProps> = ({ history = [], compact = false }) => {
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    const getEntryMeta = (entry: TestHistoryEntry) => {
        switch (entry.type) {
            case 'EMPLOYEE_SUBMISSION':
                return {
                    label: t('tests.historyEmployeeSubmission') || 'Employee Submission',
                    color: 'info' as const,
                    icon: <DevicesIcon sx={{ fontSize: 16 }} />,
                };
            case 'FILE_UPLOADED':
                return {
                    label: t('tests.historyFileUploaded') || 'Document Attached',
                    color: 'primary' as const,
                    icon: <AttachFileIcon sx={{ fontSize: 16 }} />,
                };
            case 'INSPECTOR_ACCEPT':
                return {
                    label: t('tests.historyInspectorAccept') || 'Inspector Forwarded',
                    color: 'success' as const,
                    icon: <SendIcon sx={{ fontSize: 16 }} />,
                };
            case 'INSPECTOR_REJECT':
                return {
                    label: t('tests.historyInspectorReject') || 'Inspector Requested Retest',
                    color: 'warning' as const,
                    icon: <ReplayIcon sx={{ fontSize: 16 }} />,
                };
            case 'EXPERT_REVIEW':
                return {
                    label: t('tests.historyExpertReview') || 'Expert Review Opened',
                    color: 'secondary' as const,
                    icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
                };
            case 'EXPERT_CONFIRM':
                return {
                    label: t('tests.historyExpertConfirm') || 'Expert Confirmed',
                    color: 'success' as const,
                    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
                };
            case 'EXPERT_REJECT':
                return {
                    label: t('tests.historyExpertReject') || 'Expert Rejected',
                    color: 'error' as const,
                    icon: <CancelIcon sx={{ fontSize: 16 }} />,
                };
            default:
                return {
                    label: entry.type,
                    color: 'default' as const,
                    icon: <HistoryIcon sx={{ fontSize: 16 }} />,
                };
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: compact ? 2 : 2.5,
                borderRadius: 2,
                textAlign: isRtl ? 'right' : 'left',
                direction: isRtl ? 'rtl' : 'ltr',
                backgroundColor: dark ? 'rgba(15, 23, 42, 0.35)' : '#f8fafc',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HistoryIcon fontSize="small" color="primary" />
                <Typography variant={compact ? 'subtitle2' : 'subtitle1'} color="text.primary" className="font-semibold">
                    {t('tests.testHistory') || 'Test History & Audit Trail'} ({history.length})
                </Typography>
            </Box>

            {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    {t('tests.noHistory') || 'No history events recorded for this test.'}
                </Typography>
            ) : (
                <Stack spacing={1.25}>
                    {history.map((entry) => {
                        const meta = getEntryMeta(entry);
                        const actorDisplay =
                            (entry.actorName && t(`users.${entry.actorName}`)) ||
                            entry.actorName ||
                            '-';
                        const roleDisplay = entry.actorRole
                            ? (t(`roles.${entry.actorRole}`) || entry.actorRole)
                            : '';

                        return (
                            <Box
                                key={entry.id}
                                sx={{
                                    p: 1.25,
                                    borderRadius: 1.5,
                                    border: '1px solid',
                                    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    backgroundColor: dark ? 'rgba(15, 23, 42, 0.55)' : '#ffffff',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                                        <Chip
                                            size="small"
                                            icon={meta.icon}
                                            label={meta.label}
                                            color={meta.color}
                                            variant="outlined"
                                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                        />
                                        {entry.isDirect && (
                                            <Chip
                                                size="small"
                                                label={t('tests.directBadge') || 'Direct'}
                                                color="secondary"
                                                variant="filled"
                                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                            />
                                        )}
                                        {roleDisplay && (
                                            <Chip
                                                size="small"
                                                label={roleDisplay}
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.68rem' }}
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {entry.at || '-'}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                        {actorDisplay}
                                    </Typography>
                                    {entry.previousStatus && entry.newStatus && entry.previousStatus !== entry.newStatus && (
                                        <Typography variant="caption" color="text.secondary">
                                            {t(`status.${entry.previousStatus}`) || entry.previousStatus} →{' '}
                                            <strong>{t(`status.${entry.newStatus}`) || entry.newStatus}</strong>
                                        </Typography>
                                    )}
                                </Box>

                                {entry.reason && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                                    >
                                        {entry.reason}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            )}
        </Paper>
    );
};

export default TestHistoryTimeline;
