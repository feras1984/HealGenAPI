import React, { useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupervisorContext } from "@/Services/SupervisorService/State/SupervisorContext";
import { useTranslation } from "react-i18next";

const createRejectSchema = (t: (key: string) => string) => z.object({
    reason: z
        .string()
        .trim()
        .min(3, t('validation.rejectionReasonMin') || "Rejection reason is required (minimum 3 characters).")
        .max(1000, t('validation.rejectionReasonMax') || "Rejection reason cannot exceed 1000 characters."),
});

type RejectFormValues = {
    reason: string;
};

const RejectModal: React.FC = () => {
    const { t } = useTranslation();
    const {
        selectedTest,
        isRejectModalOpen,
        closeRejectModal,
        handleRejectSubmit,
        actionLoading
    } = useSupervisorContext();

    const rejectSchema = useMemo(() => createRejectSchema(t), [t]);

    const methods = useForm<RejectFormValues>({
        resolver: zodResolver(rejectSchema),
        defaultValues: {
            reason: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = (formData: RejectFormValues) => {
        handleRejectSubmit(formData.reason).then(() => {
            methods.reset();
        });
    };

    if (!selectedTest) return null;

    return (
        <Dialog open={isRejectModalOpen} onClose={closeRejectModal} maxWidth="sm" fullWidth>
            <DialogTitle className="font-semibold flex items-center space-x-2">
                <CancelIcon color="error" />
                <span>{t('dialogs.rejectTestTitle', { id: selectedTest.id }) || `Reject Test #${selectedTest.id}`}</span>
            </DialogTitle>
            <FormProvider {...methods}>
                <Box component="form" onSubmit={methods.handleSubmit(onSubmit)} noValidate>
                    <DialogContent>
                        <DialogContentText className="mb-4">
                            {t('dialogs.rejectTestDesc', { id: selectedTest.id }) || (
                                <>Please provide a detailed rejection reason for test <strong>#{selectedTest.id}</strong>. This reason will be recorded in the audit trail.</>
                            )}
                        </DialogContentText>
                        <Controller
                            name="reason"
                            control={methods.control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    autoFocus
                                    multiline
                                    rows={4}
                                    fullWidth
                                    label={`${t('forms.rejectionReason') || 'Rejection Reason'} *`}
                                    placeholder={t('placeholders.rejectionReason') || "Provide explicit reason for rejecting this test..."}
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />
                    </DialogContent>
                    <DialogActions className="p-4 pt-0">
                        <Button onClick={closeRejectModal} disabled={actionLoading} color="inherit">
                            {t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            type="submit"
                            disabled={actionLoading}
                            variant="contained"
                            color="error"
                        >
                            {actionLoading ? (t('dialogs.rejecting') || 'Rejecting...') : (t('dialogs.confirmRejectAction') || 'Confirm Rejection')}
                        </Button>
                    </DialogActions>
                </Box>
            </FormProvider>
        </Dialog>
    );
};

export default RejectModal;
