import React from 'react';
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Device from "@/models/device/Device";
import DeviceContainer from "@/Services/DeviceService/State/DeviceContainer";
import { Box, Stack } from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";
import { useTranslation } from "react-i18next";

const DeviceList: React.FC<{ devices: Device[] }> = ({ devices }) => {
    const { t } = useTranslation();
    return (
        <AdminLayout>
            <Head title={t('nav.devices') || 'Devices'}></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/devices/add`}>
                        <CustomButton task='add' text={t('common.device') || 'Device'}></CustomButton>
                    </Link>
                </Stack>
            </Box>
            <DeviceContainer devices={devices} count={devices.length}></DeviceContainer>
        </AdminLayout>
    );
};

export default DeviceList;
