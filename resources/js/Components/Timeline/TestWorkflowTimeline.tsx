import React from 'react';
import { Alert, Box, Chip, Paper, Typography } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PatientHeader, { WorkflowStageDelay } from "@/models/patient/PatientHeader";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

interface TestWorkflowTimelineProps {
    patient: PatientHeader;
}

const TestWorkflowTimeline: React.FC<TestWorkflowTimelineProps> = ({ patient }) => {
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    const inspected = patient.inspectedBy || patient.reviewedBy || null;
    const confirmed = patient.confirmedBy || null;
    const delaySummary = patient.delaySummary || null;
    const thresholdHours = delaySummary?.thresholdHours ?? 48;

    const captureToReceive = delaySummary?.stages?.captureToReceive || null;
    const receiveToInspection = delaySummary?.stages?.receiveToInspection || null;
    const inspectionToSupervision = delaySummary?.stages?.inspectionToSupervision || null;

    const resolveUserName = (name?: string, email?: string) =>
        (name && t(`users.${name}`)) || (email && t(`users.${email}`)) || name || email || '-';

    const stagePaperSx = (completed: boolean, rejected: boolean = false, delayed: boolean = false) => ({
        p: 2,
        borderRadius: 2,
        height: '100%',
        border: '1px solid',
        borderWidth: delayed ? 2 : 1,
        borderColor: delayed
            ? '#f59e0b'
            : rejected
                ? dark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.35)'
                : completed
                    ? dark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)'
                    : dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: delayed
            ? dark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.06)'
            : rejected
                ? dark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.03)'
                : completed
                    ? dark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.03)'
                    : dark ? 'rgba(15, 23, 42, 0.35)' : '#f8fafc',
        textAlign: isRtl ? 'right' : 'left',
    });

    const renderStageDelayBadge = (stage: WorkflowStageDelay | null, transitionLabel: string) => {
        if (!stage) return null;

        if (stage.isDelayed) {
            return (
                <Box sx={{ mt: 1 }}>
                    <Chip
                        size="small"
                        icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                        label={
                            stage.isOngoing
                                ? (t('delay.waitingDelayedBadge', { duration: stage.formatted, hours: thresholdHours }) ||
                                    `Waiting ${stage.formatted} (>${thresholdHours}h)`)
                                : (t('delay.stageDelayedBadge', { label: transitionLabel, duration: stage.formatted, hours: thresholdHours }) ||
                                    `${transitionLabel}: +${stage.formatted} (>${thresholdHours}h)`)
                        }
                        color="warning"
                        variant="filled"
                        sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                </Box>
            );
        }

        return (
            <Box sx={{ mt: 1 }}>
                <Chip
                    size="small"
                    label={
                        stage.isOngoing
                            ? `${t('delay.waiting') || 'Waiting'}: ${stage.formatted}`
                            : `${transitionLabel}: +${stage.formatted}`
                    }
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.68rem' }}
                />
            </Box>
        );
    };

    const isInspectorRejected = inspected?.action === 'INSPECTOR_REJECT';
    const isSupervisorRejected = confirmed?.action === 'SUPERVISOR_REJECT';

    return (
        <Box sx={{ mb: 3, direction: isRtl ? 'rtl' : 'ltr' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccessTimeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>
                    {t('tests.workflowTimingTimeline') || 'Workflow Timing Timeline'}
                </Typography>
            </Box>

            {delaySummary?.hasDelay && (
                <Alert
                    severity="warning"
                    icon={<ScheduleIcon fontSize="inherit" />}
                    sx={{ mb: 2, borderRadius: 2 }}
                >
                    {t('delay.timelineAlert', {
                        count: delaySummary.delayedCount,
                        hours: thresholdHours,
                        duration: delaySummary.maxDelayFormatted || '',
                    }) ||
                        `Delay detected: ${delaySummary.delayedCount} stage transition(s) exceeded the ${thresholdHours}-hour threshold (max: ${delaySummary.maxDelayFormatted}).`}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    gap: 2,
                }}
            >
                {/* Stage 1: Captured -> Received (Employee / Device) */}
                <Paper variant="outlined" sx={stagePaperSx(true, false, !!captureToReceive?.isDelayed)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <DevicesIcon fontSize="small" color={captureToReceive?.isDelayed ? 'warning' : 'info'} />
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                                {t('tests.stageCapture') || '1. Capture (Employee / Device)'}
                            </Typography>
                        </Box>
                        <Chip
                            size="small"
                            label={t('roles.Employee') || 'Employee'}
                            color="info"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                        />
                    </Box>

                    <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('tests.capturedTime') || 'Captured Time'}
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                            {patient.capturedAt || patient.createdAt || '-'}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: patient.attachment ? 1 : 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('tests.receivedTime') || 'Server Received Time'}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                            {patient.receivedAt || patient.createdAt || '-'}
                        </Typography>
                    </Box>

                    {patient.attachment && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {t('tests.attachmentUploadedTime') || 'Document Uploaded Time'}
                            </Typography>
                            <Typography variant="caption" color="text.primary" sx={{ fontWeight: 500 }}>
                                {patient.attachment.createdAt || '-'}
                            </Typography>
                        </Box>
                    )}

                    {renderStageDelayBadge(
                        captureToReceive,
                        t('delay.captureToReceive') || 'Captured → Received'
                    )}
                </Paper>

                {/* Stage 2: Received -> Inspection (Inspector / Admin) */}
                <Paper variant="outlined" sx={stagePaperSx(!!inspected, isInspectorRejected, !!receiveToInspection?.isDelayed)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <FactCheckIcon
                                fontSize="small"
                                color={
                                    receiveToInspection?.isDelayed
                                        ? 'warning'
                                        : isInspectorRejected
                                            ? 'error'
                                            : inspected
                                                ? 'success'
                                                : 'disabled'
                                }
                            />
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                                {t('tests.stageInspection') || '2. Inspection (Inspector / Admin)'}
                            </Typography>
                        </Box>
                        {inspected?.role && (
                            <Chip
                                size="small"
                                label={t(`roles.${inspected.role}`) || inspected.role}
                                color={isInspectorRejected ? 'error' : 'primary'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                            />
                        )}
                    </Box>

                    {inspected ? (
                        <>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {t('tests.inspectedTime') || 'Inspection Time'}
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                                    {inspected.at || inspected.reviewedAt || '-'}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {resolveUserName(inspected.name, inspected.email)}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {t('tests.pendingInspection') || 'Pending inspection'}
                        </Typography>
                    )}

                    {renderStageDelayBadge(
                        receiveToInspection,
                        t('delay.receiveToInspection') || 'Received → Inspection'
                    )}
                </Paper>

                {/* Stage 3: Inspection -> Supervision (Supervisor / Admin) */}
                <Paper variant="outlined" sx={stagePaperSx(!!confirmed, isSupervisorRejected, !!inspectionToSupervision?.isDelayed)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <VerifiedIcon
                                fontSize="small"
                                color={
                                    inspectionToSupervision?.isDelayed
                                        ? 'warning'
                                        : isSupervisorRejected
                                            ? 'error'
                                            : confirmed
                                                ? 'success'
                                                : 'disabled'
                                }
                            />
                            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                                {t('tests.stageConfirmation') || '3. Confirmation (Expert / Admin)'}
                            </Typography>
                        </Box>
                        {confirmed?.role && (
                            <Chip
                                size="small"
                                label={t(`roles.${confirmed.role}`) || confirmed.role}
                                color={isSupervisorRejected ? 'error' : 'success'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                            />
                        )}
                    </Box>

                    {confirmed ? (
                        <>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {t('tests.confirmedTime') || 'Confirmation Time'}
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                                    {confirmed.at || confirmed.reviewedAt || '-'}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {resolveUserName(confirmed.name, confirmed.email)}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {t('tests.pendingConfirmation') || 'Pending expert confirmation'}
                        </Typography>
                    )}

                    {renderStageDelayBadge(
                        inspectionToSupervision,
                        t('delay.inspectionToSupervision') || 'Inspection → Expert Review'
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default TestWorkflowTimeline;
