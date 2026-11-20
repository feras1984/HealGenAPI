import React from 'react';
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import DeviceType from "@/models/device/DeviceType";
import DeviceTypeContainer from "@/Services/DeviceTypeService/State/DeviceTypeContainer";
import { Box, Stack } from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";
import { useTranslation } from "react-i18next";

const DeviceTypeList: React.FC<{ deviceTypes: DeviceType[] }> = ({ deviceTypes }) => {
    const { t } = useTranslation();
    return (
        <AdminLayout>
            <Head title={t('nav.deviceTypes') || 'Device Types'}></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/device-types/add`}>
                        <CustomButton task='add' text={t('forms.deviceType') || 'Device Type'}></CustomButton>
                    </Link>
                </Stack>
            </Box>
            <DeviceTypeContainer deviceTypes={deviceTypes} count={deviceTypes.length}></DeviceTypeContainer>
        </AdminLayout>
    );
};

export default DeviceTypeList;
