import React from 'react';
import {Head, Link} from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Administrator from "@/models/User/Administrator";
import AdminContainer from "@/Services/UserService/State/AdminContainer";
import {Box, Stack} from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";
import { useTranslation } from "react-i18next";

const Administrators: React.FC<{users: Administrator []}> = ({users}) => {
    const { t } = useTranslation();
    return (
        <AdminLayout>
            <Head title={t('nav.users') || 'Users'}></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/users/add`}>
                        <CustomButton task='add' text={t('common.user') || 'user'}></CustomButton>
                    </Link>
                </Stack>
            </Box>
            <AdminContainer admins={users} count={users.length}></AdminContainer>
        </AdminLayout>
    );
};

export default Administrators;
