import React from 'react';
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Container } from "typedi";
import "reflect-metadata";
import DeviceUserService from "@/Services/DeviceUserService/DeviceUserService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Breadcrumbs, Stack, Typography } from "@mui/material";
import ValidatedSelect from "@/Components/ValidatedComponents/ValidatedSelect";
import CustomButton from "@/Components/Button/CustomButton";
import Device from "@/models/device/Device";
import Administrator from "@/models/User/Administrator";

interface DeviceUserAssignProps {
    devices: Device[];
    users: Administrator[];
}

const DeviceUserAssign: React.FC<DeviceUserAssignProps> = ({ devices, users }) => {
    const deviceUserService = Container.get(DeviceUserService);
    const [loading, setLoading] = React.useState(false);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const assignSchema = z.object({
        deviceId: z.number().min(1, { message: 'Please select a device!' }),
        userId: z.number().min(1, { message: 'Please select an employee/user!' }),
    });

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(assignSchema),
        defaultValues: {
            deviceId: devices.length > 0 ? devices[0].id : -1,
            userId: users.length > 0 ? users[0].id : -1,
        }
    });

    const store = () => {
        setLoading(true);
        const data = methods.getValues();

        deviceUserService.assignDevice(data)
            .then(() => {
                setSnackbar({
                    open: true,
                    message: 'Device assigned to user successfully!',
                    severity: "success"
                });
            })
            .catch((error) => {
                setSnackbar({
                    open: true,
                    message: 'Error happened while assigning device!',
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <AdminLayout>
            <Head title="Assign Device to User" />
            <Box>
                <Breadcrumbs>
                    <Link href={`/device-users`}>Back to assignments</Link>
                    <Typography>Assign Device to User</Typography>
                </Breadcrumbs>
                <Box className="p-[16px]">
                    <Typography variant="h5">Assign Device to User</Typography>
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
                        <ValidatedSelect
                            control={methods.control}
                            controlName="deviceId"
                            id="deviceId"
                            label="Device"
                            placeholder="Select Device"
                            withNone={false}
                            items={devices.map(dev => ({
                                id: dev.id,
                                name: `${dev.name} (${dev.deviceCode})`,
                            }))}
                        />

                        <ValidatedSelect
                            control={methods.control}
                            controlName="userId"
                            id="userId"
                            label="User / Employee"
                            placeholder="Select User"
                            withNone={false}
                            items={users.map(u => ({
                                id: u.id,
                                name: `${u.name || u.firstName || 'User'} (${u.email})`,
                            }))}
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
                                text={'Assignment'}
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

export default DeviceUserAssign;
