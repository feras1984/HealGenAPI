import React from 'react';
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Container } from "typedi";
import "reflect-metadata";
import DeviceTypeService from "@/Services/DeviceTypeService/DeviceTypeService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Breadcrumbs, Stack, Typography } from "@mui/material";
import ValidatedCheckbox from "@/Components/ValidatedComponents/ValidatedCheckbox";
import CustomButton from "@/Components/Button/CustomButton";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";

const DeviceTypeAdd = () => {
    const deviceTypeService = Container.get(DeviceTypeService);
    const [loading, setLoading] = React.useState(false);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const deviceTypeSchema = z.object({
        name: z.string().min(2, { message: 'Name should be at least 2 characters!' }),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
    });

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(deviceTypeSchema),
        defaultValues: {
            name: "",
            manufacturer: "",
            model: "",
            description: "",
            isActive: true,
        }
    });

    const store = () => {
        setLoading(true);
        const data = methods.getValues();

        deviceTypeService.storeDeviceType(data)
            .then(() => {
                methods.reset();
                setSnackbar({
                    open: true,
                    message: 'Device Type added successfully!',
                    severity: "success"
                });
            })
            .catch((error) => {
                setSnackbar({
                    open: true,
                    message: 'Error happened while storing device type!',
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <AdminLayout>
            <Head title="Add Device Type" />
            <Box>
                <Breadcrumbs>
                    <Link href={`/device-types`}>Back to device types</Link>
                    <Typography>Add New Device Type</Typography>
                </Breadcrumbs>
                <Box className="p-[16px]">
                    <Typography variant="h5">Add New Device Type</Typography>
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
                            label="Is Active"
                        />

                        <ValidatedInput
                            controlName="name"
                            name="name"
                            id="name"
                            label="Type Name"
                            placeholder="e.g. HealGen D600 Reader"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="manufacturer"
                            name="manufacturer"
                            id="manufacturer"
                            label="Manufacturer"
                            placeholder="e.g. HealGen Scientific"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="model"
                            name="model"
                            id="model"
                            label="Model Number / Code"
                            placeholder="e.g. D600-V2"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="description"
                            name="description"
                            id="description"
                            label="Description"
                            placeholder="Device type specifications"
                            multiline
                            rows={3}
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
                                text={'Device Type'}
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

export default DeviceTypeAdd;
