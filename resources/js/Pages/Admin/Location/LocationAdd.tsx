import React from 'react';
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Container } from "typedi";
import "reflect-metadata";
import LocationService from "@/Services/LocationService/LocationService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Breadcrumbs, Stack, Typography } from "@mui/material";
import ValidatedCheckbox from "@/Components/ValidatedComponents/ValidatedCheckbox";
import CustomButton from "@/Components/Button/CustomButton";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import { useTranslation } from "react-i18next";

const LocationAdd = () => {
    const { t } = useTranslation();
    const locationService = Container.get(LocationService);
    const [loading, setLoading] = React.useState(false);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const locationSchema = z.object({
        name: z.string().min(3, { message: t('validation.nameMin') || 'Name should be at least 3 characters!' }),
        code: z.string().min(2, { message: t('validation.codeMin') || 'Code should be at least 2 characters!' })
            .refine(
                async (code) => {
                    const response = await locationService.validateCode(code);
                    return response.data.status;
                },
                { message: t('validation.codeExists') || 'Location code already exists!' }
            ),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().default(true),
    });

    type LocationSchemaType = z.infer<typeof locationSchema>;

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: "",
            code: "",
            address: "",
            city: "",
            country: "",
            notes: "",
            isActive: true,
        }
    });

    const store = () => {
        setLoading(true);
        const data = methods.getValues();

        locationService.storeLocation(data)
            .then(() => {
                methods.reset();
                setSnackbar({
                    open: true,
                    message: t('messages.addedSuccess') || 'Location added successfully!',
                    severity: "success"
                });
            })
            .catch((error) => {
                setSnackbar({
                    open: true,
                    message: t('messages.errorOccurred') || 'Error happened while storing location!',
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <AdminLayout>
            <Head title={t('forms.addNewLocation') || "Add Location"} />
            <Box>
                <Breadcrumbs>
                    <Link href={`/locations`}>{t('nav.locations') || 'Locations'}</Link>
                    <Typography>{t('forms.addNewLocation') || 'Add New Location'}</Typography>
                </Breadcrumbs>
                <Box className="p-[16px]">
                    <Typography variant="h5">{t('forms.addNewLocation') || 'Add New Location'}</Typography>
                </Box>

                <FormProvider {...methods}>
                    <Box
                        component="form"
                        sx={{
                            '& .MuiTextField-root': { m: 1, width: '100%' },
                        }}
                        noValidate
                        autoComplete="off"
                        onSubmit={methods.handleSubmit(store)}
                    >
                        <ValidatedCheckbox
                            name="isActive"
                            id="isActive"
                            color="secondary"
                            control={methods.control}
                            label={t('forms.isActive') || "Is Active"}
                        />

                        <ValidatedInput
                            controlName="name"
                            name="name"
                            id="name"
                            label={t('forms.locationName') || "Location Name"}
                            placeholder={t('placeholders.locationName') || "Location Name"}
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="code"
                            name="code"
                            id="code"
                            label={t('forms.locationCode') || "Location Code"}
                            placeholder={t('placeholders.locationCode') || "e.g. LOC-001"}
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="city"
                            name="city"
                            id="city"
                            label={t('forms.city') || "City"}
                            placeholder={t('placeholders.city') || "City"}
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="country"
                            name="country"
                            id="country"
                            label={t('forms.country') || "Country"}
                            placeholder={t('placeholders.country') || "Country"}
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="address"
                            name="address"
                            id="address"
                            label={t('forms.address') || "Address"}
                            placeholder={t('placeholders.address') || "Full Address"}
                            multiline
                            rows={3}
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="notes"
                            name="notes"
                            id="notes"
                            label={t('forms.notes') || "Notes"}
                            placeholder={t('placeholders.notes') || "Additional Notes"}
                            multiline
                            rows={2}
                            control={methods.control}
                        />

                        <Stack
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                            spacing={2}
                            className="m-[8px]"
                        >
                            <CustomButton
                                task="add"
                                text={t('common.save') || 'Location'}
                                disabled={loading}
                            />
                        </Stack>
                    </Box>
                </FormProvider>
                <CustomSnackbar
                    open={snackbar.open}
                    message={snackbar.message}
                    onClose={handleClose}
                    severity={snackbar.severity}
                />
            </Box>
        </AdminLayout>
    );
};

export default LocationAdd;
