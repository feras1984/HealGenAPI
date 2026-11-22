import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Alert,
    AlertTitle,
    Box,
    Typography,
    Paper,
    IconButton,
    Checkbox,
    FormControlLabel,
    Divider,
    Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PatientHeader from "@/models/patient/PatientHeader";
import { summarizeTestResults, TestResultSummary } from "@/Utils/TestResultSummaryHelper";
import ResultSummaryChip from "@/Components/BulkAction/ResultSummaryChip";
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

export interface BulkActionConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (note?: string) => Promise<void> | void;
    onRemoveItem?: (id: number) => void;
    onRemoveFlagged?: (flaggedIds: number[]) => void;
    selectedTests: PatientHeader[];
    loading: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    loadingLabel: string;
    confirmColor?: 'success' | 'primary' | 'warning' | 'error';
    showNoteField?: boolean;
    noteLabel?: string;
    notePlaceholder?: string;
}

interface TestWithSummary {
    test: PatientHeader;
    summary: TestResultSummary;
}

const BulkActionConfirmDialog: React.FC<BulkActionConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    onRemoveItem,
    onRemoveFlagged,
    selectedTests,
    loading,
    title,
    description,
    confirmLabel,
    loadingLabel,
    confirmColor = 'success',
    showNoteField = true,
    noteLabel,
    notePlaceholder,
}) => {
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    const [note, setNote] = useState<string>('');
    const [acknowledgedFindings, setAcknowledgedFindings] = useState<boolean>(false);

    const testsWithSummary: TestWithSummary[] = useMemo(
        () => selectedTests.map(test => ({ test, summary: summarizeTestResults(test.tests) })),
        [selectedTests]
    );

    const flaggedEntries = useMemo(
        () => testsWithSummary.filter(entry => entry.summary.hasFindings),
        [testsWithSummary]
    );

    const flaggedIds = useMemo(
        () => flaggedEntries.map(entry => entry.test.id),
        [flaggedEntries]
    );

    const hasPositiveFindings = useMemo(
        () => flaggedEntries.some(entry => entry.summary.status === 'positive'),
        [flaggedEntries]
    );

    const hasFlagged = flaggedEntries.length > 0;

    // Reset local state whenever dialog opens/closes or flagged items change
    useEffect(() => {
        if (!open) {
            setNote('');
            setAcknowledgedFindings(false);
        }
    }, [open]);

    useEffect(() => {
        setAcknowledgedFindings(false);
    }, [flaggedIds.join(',')]);

    // Auto-close if user removes the last test from inside the dialog
    useEffect(() => {
        if (open && selectedTests.length === 0 && !loading) {
            onClose();
        }
    }, [open, selectedTests.length, loading, onClose]);

    const handleSubmit = async () => {
        await onConfirm(showNoteField ? note : undefined);
        setNote('');
        setAcknowledgedFindings(false);
    };

    const canSubmit = !loading && selectedTests.length > 0 && (!hasFlagged || acknowledgedFindings);

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                dir: isRtl ? 'rtl' : 'ltr',
                sx: {
                    backgroundColor: dark ? 'var(--clr-bg-content-dark, #1e293b)' : '#ffffff',
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasFlagged ? (
                    <WarningAmberIcon color={hasPositiveFindings ? 'error' : 'warning'} />
                ) : (
                    <CheckCircleIcon color={confirmColor} />
                )}
                <span>{title}</span>
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    {description}
                </DialogContentText>

                {/* Prominent warning when any selected test has Positive or Abnormal findings */}
                {hasFlagged && (
                    <Alert
                        severity={hasPositiveFindings ? 'error' : 'warning'}
                        sx={{ mb: 2, borderRadius: 1.5 }}
                        action={
                            onRemoveFlagged ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    variant="outlined"
                                    onClick={() => onRemoveFlagged(flaggedIds)}
                                    disabled={loading}
                                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                                >
                                    {t('bulk.removeFlagged') || 'Remove Flagged'}
                                </Button>
                            ) : undefined
                        }
                    >
                        <AlertTitle sx={{ fontWeight: 700 }}>
                            {t('bulk.findingsWarningTitle') || 'Positive / Abnormal Findings Detected'}
                        </AlertTitle>
                        <Typography variant="body2">
                            {t('bulk.findingsWarningDesc', { count: flaggedEntries.length }) ||
                                `${flaggedEntries.length} of the selected test(s) contain positive or abnormal substance results. Please review them carefully or remove them before bulk confirming.`}
                        </Typography>
                    </Alert>
                )}

                {/* Compact scrollable preview list of selected tests */}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
                    {t('bulk.selectedTestsPreview', { count: selectedTests.length }) ||
                        `Selected Tests (${selectedTests.length})`}
                </Typography>

                <Paper
                    variant="outlined"
                    sx={{
                        maxHeight: 230,
                        overflowY: 'auto',
                        mb: 2,
                        borderRadius: 1.5,
                        backgroundColor: dark ? 'rgba(15, 23, 42, 0.45)' : '#f8fafc',
                        borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                    }}
                >
                    {testsWithSummary.map(({ test, summary }, index) => (
                        <React.Fragment key={test.id}>
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    backgroundColor: summary.hasFindings
                                        ? dark
                                            ? 'rgba(239, 68, 68, 0.14)'
                                            : 'rgba(239, 68, 68, 0.06)'
                                        : 'transparent',
                                }}
                            >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }} noWrap>
                                        #{test.id} — {test.patientId || '-'}
                                        {test.donorId ? ` (${test.donorId})` : ''}
                                    </Typography>
                                    {summary.hasFindings && summary.flaggedSubstances.length > 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 500 }}>
                                            {summary.flaggedSubstances
                                                .map(s => `${s.substance}: ${s.softwareResult !== '-' ? s.softwareResult : s.visualResult}`)
                                                .join(', ')}
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                    <ResultSummaryChip summary={summary} />
                                    {onRemoveItem && (
                                        <Tooltip title={t('bulk.removeFromBatch') || 'Remove from batch'}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onRemoveItem(test.id)}
                                                    disabled={loading}
                                                    aria-label="Remove test from batch"
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                            {index < testsWithSummary.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </Paper>

                {/* Explicit acknowledgment when flagged tests remain in the batch */}
                {hasFlagged && (
                    <Box
                        sx={{
                            mb: showNoteField ? 2 : 0,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: dark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
                            backgroundColor: dark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.03)',
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={acknowledgedFindings}
                                    onChange={(e) => setAcknowledgedFindings(e.target.checked)}
                                    color="error"
                                    size="small"
                                    disabled={loading}
                                />
                            }
                            label={
                                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                                    {t('bulk.acknowledgeFindings') ||
                                        'I acknowledge the positive/abnormal findings above and want to confirm all listed tests.'}
                                </Typography>
                            }
                        />
                    </Box>
                )}

                {showNoteField && (
                    <TextField
                        fullWidth
                        size="small"
                        label={noteLabel || `${t('forms.supervisorNote') || 'Supervisor Note'} (${t('forms.optional') || 'Optional'})`}
                        placeholder={notePlaceholder || t('placeholders.supervisorNote') || 'Add optional notes for this batch...'}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        multiline
                        rows={2}
                        disabled={loading}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                <Button onClick={onClose} disabled={loading} color="inherit" sx={{ textTransform: 'none' }}>
                    {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    variant="contained"
                    color={confirmColor}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    {loading ? loadingLabel : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkActionConfirmDialog;
