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
import ReplayIcon from '@mui/icons-material/Replay';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInspectorContext } from "@/Services/InspectorService/State/InspectorContext";
import { useTranslation } from "react-i18next";

const createRejectSchema = (t: (key: string) => string) => z.object({
    reason: z
        .string()
        .trim()
        .min(3, t('validation.retestReasonMin') || t('validation.rejectionReasonMin') || "Retest reason is required (minimum 3 characters).")
        .max(1000, t('validation.retestReasonMax') || t('validation.rejectionReasonMax') || "Retest reason cannot exceed 1000 characters."),
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
    } = useInspectorContext();

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
                <ReplayIcon color="warning" />
                <span>{t('dialogs.retestTestTitle', { id: selectedTest.id }) || `Request Retest for Test #${selectedTest.id}`}</span>
            </DialogTitle>
            <FormProvider {...methods}>
                <Box component="form" onSubmit={methods.handleSubmit(onSubmit)} noValidate>
                    <DialogContent>
                        <DialogContentText className="mb-4">
                            {t('dialogs.retestTestDesc', { id: selectedTest.id }) || (
                                <>Please provide a reason for requesting a retest of test <strong>#{selectedTest.id}</strong>. This reason will be recorded in the audit trail.</>
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
                                    label={`${t('forms.retestReason') || t('forms.rejectionReason') || 'Retest Reason'} *`}
                                    placeholder={t('placeholders.retestReason') || t('placeholders.rejectionReason') || "Provide explicit reason for requesting a retest..."}
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
                            color="warning"
                            startIcon={<ReplayIcon />}
                        >
                            {actionLoading ? (t('dialogs.retesting') || 'Requesting Retest...') : (t('dialogs.confirmRetestAction') || 'Confirm Retest')}
                        </Button>
                    </DialogActions>
                </Box>
            </FormProvider>
        </Dialog>
    );
};

export default RejectModal;
