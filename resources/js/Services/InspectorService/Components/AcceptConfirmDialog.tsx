import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useInspectorContext } from "@/Services/InspectorService/State/InspectorContext";
import { useTranslation } from "react-i18next";

const AcceptConfirmDialog: React.FC = () => {
    const { t } = useTranslation();
    const {
        selectedTest,
        isAcceptDialogOpen,
        closeAcceptDialog,
        handleAcceptConfirm,
        actionLoading
    } = useInspectorContext();

    if (!selectedTest) return null;

    const patientLabel = selectedTest.patientId || selectedTest.donorId || '';

    return (
        <Dialog open={isAcceptDialogOpen} onClose={closeAcceptDialog} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold flex items-center space-x-2">
                <SendIcon color="success" />
                <span>{t('dialogs.forwardTestTitle', { id: selectedTest.id }) || `Forward Test #${selectedTest.id}?`}</span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('dialogs.forwardTestDesc', { id: selectedTest.id, patient: patientLabel }) || (
                        <>
                            Are you sure you want to forward test <strong>#{selectedTest.id}</strong> (Patient: {patientLabel})?
                            <br />
                            This test will be forwarded to the next workflow stage (Expert Review).
                        </>
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions className="p-4 pt-0">
                <Button onClick={closeAcceptDialog} disabled={actionLoading} color="inherit">
                    {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                    onClick={handleAcceptConfirm}
                    disabled={actionLoading}
                    variant="contained"
                    color="success"
                    startIcon={<SendIcon />}
                    autoFocus
                >
                    {actionLoading ? (t('dialogs.forwarding') || 'Forwarding...') : (t('dialogs.forwardAction') || 'Forward')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AcceptConfirmDialog;
