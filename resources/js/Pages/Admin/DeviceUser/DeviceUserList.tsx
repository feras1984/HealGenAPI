import React from 'react';
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import DeviceUser from "@/models/device/DeviceUser";
import DeviceUserContainer from "@/Services/DeviceUserService/State/DeviceUserContainer";
import { Box, Stack } from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";

const DeviceUserList: React.FC<{ assignments: DeviceUser[] }> = ({ assignments }) => {
    return (
        <AdminLayout>
            <Head title="Device Assignments"></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/device-users/assign`}>
                        <CustomButton task='add' text={'Device Assignment'}></CustomButton>
                    </Link>
                </Stack>
            </Box>
            <DeviceUserContainer assignments={assignments} count={assignments.length}></DeviceUserContainer>
        </AdminLayout>
    );
};

export default DeviceUserList;
