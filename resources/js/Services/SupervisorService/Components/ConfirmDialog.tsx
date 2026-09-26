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

const ConfirmDialog: React.FC = () => {
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

    return (
        <Dialog open={isConfirmDialogOpen} onClose={closeConfirmDialog} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold flex items-center space-x-2">
                <CheckCircleIcon color="success" />
                <span>Confirm Test #{selectedTest.id}?</span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText className="mb-3">
                    Are you sure you want to confirm test <strong>#{selectedTest.id}</strong> (Patient: {selectedTest.patientId || selectedTest.donorId})?
                    <br />
                    This test will be marked as <strong>Confirmed</strong> and dispatched to the HIS integration pipeline.
                </DialogContentText>
                <TextField
                    fullWidth
                    size="small"
                    label="Supervisor Note (Optional)"
                    placeholder="Add optional notes..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    multiline
                    rows={2}
                />
            </DialogContent>
            <DialogActions className="p-4 pt-0">
                <Button onClick={closeConfirmDialog} disabled={actionLoading} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={actionLoading}
                    variant="contained"
                    color="success"
                    autoFocus
                >
                    {actionLoading ? 'Confirming...' : 'Confirm Test & Send to HIS'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
