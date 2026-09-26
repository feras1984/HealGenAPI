import React from 'react';
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Container } from "typedi";
import "reflect-metadata";
import DeviceService from "@/Services/DeviceService/DeviceService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Breadcrumbs, Stack, Typography } from "@mui/material";
import ValidatedCheckbox from "@/Components/ValidatedComponents/ValidatedCheckbox";
import ValidatedSelect from "@/Components/ValidatedComponents/ValidatedSelect";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import CustomButton from "@/Components/Button/CustomButton";
import Location from "@/models/location/Location";
import DeviceType from "@/models/device/DeviceType";
import Device from "@/models/device/Device";

interface DeviceEditProps {
    device: Device;
    locations: Location[];
    deviceTypes: DeviceType[];
}

const DeviceEdit: React.FC<DeviceEditProps> = ({ device, locations, deviceTypes }) => {
    const deviceService = Container.get(DeviceService);
    const [loading, setLoading] = React.useState(false);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const deviceSchema = z.object({
        // locationId: z.number().min(1, { message: 'Please select a location!' }),
        // deviceTypeId: z.number().min(1, { message: 'Please select a device type!' }),
        name: z.string().min(2, { message: 'Name should be at least 2 characters!' }),
        deviceCode: z.string().min(2, { message: 'Device code should be at least 2 characters!' })
            .refine(
                async (code) => {
                    const response = await deviceService.validateCode(code, device.id);
                    return response.data.status;
                },
                { message: 'Device code already exists!' }
            ),
        serialNumber: z.string().optional(),
        ipAddress: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().default(true),
    });

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(deviceSchema),
        defaultValues: {
            locationId: device.locationId ?? (locations.length > 0 ? locations[0].id : -1),
            deviceTypeId: device.deviceTypeId ?? (deviceTypes.length > 0 ? deviceTypes[0].id : -1),
            name: device.name ?? "",
            deviceCode: device.deviceCode ?? "",
            serialNumber: device.serialNumber ?? "",
            ipAddress: device.ipAddress ?? "",
            notes: device.notes ?? "",
            isActive: device.isActive ?? true,
        }
    });

    const update = () => {
        setLoading(true);
        const data = methods.getValues();

        deviceService.updateDevice(data, device.id)
            .then(() => {
                setSnackbar({
                    open: true,
                    message: 'Device updated successfully!',
                    severity: "success"
                });
            })
            .catch((error) => {
                setSnackbar({
                    open: true,
                    message: 'Error happened while updating device!',
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <AdminLayout>
            <Head title="Edit Device" />
            <Box>
                <Breadcrumbs>
                    <Link href={`/devices`}>Back to devices</Link>
                    <Typography>Edit Device</Typography>
                </Breadcrumbs>
                <Box className="p-[16px]">
                    <Typography variant="h5">Edit Device: {device.name}</Typography>
                </Box>

                <FormProvider {...methods}>
                    <Box
                        component="form"
                        sx={{
                            '& .MuiTextField-root': { m: 1, width: '100%' },
                        }}
                        noValidate
                        autoComplete="off"
                        onSubmit={methods.handleSubmit(update)}
                    >
                        <ValidatedCheckbox
                            name="isActive"
                            id="isActive"
                            color="secondary"
                            control={methods.control}
                            label="Is Active"
                        />

                        <ValidatedSelect
                            control={methods.control}
                            controlName="locationId"
                            id="locationId"
                            label="Location"
                            placeholder="Select Location"
                            withNone={false}
                            items={locations.map(loc => ({
                                id: loc.id,
                                name: `${loc.name} (${loc.code})`,
                            }))}
                        />

                        <ValidatedSelect
                            control={methods.control}
                            controlName="deviceTypeId"
                            id="deviceTypeId"
                            label="Device Type"
                            placeholder="Select Device Type"
                            withNone={false}
                            items={deviceTypes.map(dt => ({
                                id: dt.id,
                                name: dt.name,
                            }))}
                        />

                        <ValidatedInput
                            controlName="name"
                            name="name"
                            id="name"
                            label="Device Name"
                            placeholder="e.g. Lab D600 Reader 01"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="deviceCode"
                            name="deviceCode"
                            id="deviceCode"
                            label="Device Integration Code"
                            placeholder="e.g. D600-DXB-001"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="serialNumber"
                            name="serialNumber"
                            id="serialNumber"
                            label="Serial Number"
                            placeholder="Manufacturer Serial Number"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="ipAddress"
                            name="ipAddress"
                            id="ipAddress"
                            label="IP Address"
                            placeholder="192.168.1.100"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="notes"
                            name="notes"
                            id="notes"
                            label="Notes"
                            placeholder="Additional Notes"
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
                                task="update"
                                text={'Device'}
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

export default DeviceEdit;
