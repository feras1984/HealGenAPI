import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useTranslation } from "react-i18next";

const ConfirmDialog: React.FC = () => {
    const { t } = useTranslation();
    const {
        selectedTest,
        isConfirmDialogOpen,
        closeConfirmDialog,
        handleConfirmSubmit,
        actionLoading
    } = useSupervisorContext();
    const [note, setNote] = useState<string>('');

    if (!selectedTest) return null;

    const onConfirm = () => {
        handleConfirmSubmit(note).then(() => {
            setNote('');
        });
    };

    const patientLabel = selectedTest.patientId || selectedTest.donorId || '';

    return (
        <Dialog open={isConfirmDialogOpen} onClose={closeConfirmDialog} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold flex items-center space-x-2">
                <CheckCircleIcon color="success" />
                <span>{t('dialogs.confirmTestTitle', { id: selectedTest.id }) || `Confirm Test #${selectedTest.id}?`}</span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText className="mb-3">
                    {t('dialogs.confirmTestDesc', { id: selectedTest.id, patient: patientLabel }) || (
                        <>
                            Are you sure you want to confirm test <strong>#{selectedTest.id}</strong> (Patient: {patientLabel})?
                            <br />
                            This test will be marked as <strong>Confirmed</strong> and dispatched to the HIS integration pipeline.
                        </>
                    )}
                </DialogContentText>
                <TextField
                    fullWidth
                    size="small"
                    label={`${t('forms.supervisorNote') || 'Expert Note'} (${t('forms.optional') || 'Optional'})`}
                    placeholder={t('placeholders.supervisorNote') || "Add optional notes..."}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    multiline
                    rows={2}
                />
            </DialogContent>
            <DialogActions className="p-4 pt-0">
                <Button onClick={closeConfirmDialog} disabled={actionLoading} color="inherit">
                    {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={actionLoading}
                    variant="contained"
                    color="success"
                    autoFocus
                >
                    {actionLoading ? (t('dialogs.confirming') || 'Confirming...') : (t('dialogs.confirmAndSendAction') || 'Confirm Test & Send to HIS')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
