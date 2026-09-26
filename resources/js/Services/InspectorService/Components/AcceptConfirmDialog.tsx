import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useInspectorContext } from "@/Services/InspectorService/State/InspectorContext";

const AcceptConfirmDialog: React.FC = () => {
    const {
        selectedTest,
        isAcceptDialogOpen,
        closeAcceptDialog,
        handleAcceptConfirm,
        actionLoading
    } = useInspectorContext();

    if (!selectedTest) return null;

    return (
        <Dialog open={isAcceptDialogOpen} onClose={closeAcceptDialog} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold flex items-center space-x-2">
                <CheckCircleIcon color="success" />
                <span>Accept Test #{selectedTest.id}?</span>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to accept test <strong>#{selectedTest.id}</strong> (Patient: {selectedTest.patientId || selectedTest.donorId})?
                    <br />
                    This test will be accepted and moved to the next workflow stage (Supervisor Review).
                </DialogContentText>
            </DialogContent>
            <DialogActions className="p-4 pt-0">
                <Button onClick={closeAcceptDialog} disabled={actionLoading} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleAcceptConfirm}
                    disabled={actionLoading}
                    variant="contained"
                    color="success"
                    autoFocus
                >
                    {actionLoading ? 'Accepting...' : 'Accept Test'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AcceptConfirmDialog;
