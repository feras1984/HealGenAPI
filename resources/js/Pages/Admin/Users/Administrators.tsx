import React from 'react';
import {Head, Link} from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Administrator from "@/models/User/Administrator";
import AdminContainer from "@/Services/UserService/State/AdminContainer";
import {Box, Stack} from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";

const Administrators: React.FC<{users: Administrator []}> = ({users}) => {
    return (
        <AdminLayout>
            <Head title="Users"></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/users/add`}>
                        <CustomButton task='add' text={'user'}></CustomButton>
                    </Link>

                    {/*<Link href={`/admin/website/block/reorder/${category}`}>*/}
                    {/*    <CustomButton task='reorder' text={getTitle()}></CustomButton>*/}
                    {/*</Link>*/}
                </Stack>
            </Box>
            <AdminContainer admins={users} count={users.length}></AdminContainer>
        </AdminLayout>
    );
};

export default Administrators;
