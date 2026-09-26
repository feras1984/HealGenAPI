import React from 'react';
import Administrator from "@/models/User/Administrator";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import {Head} from "@inertiajs/react";
import UserEdit from "@/Pages/Admin/Shared/UserEdit";

const AdministratorEdit: React.FC<{user: Administrator}> = ({user}) => {
    return (
        <AdminLayout>
            <Head title={'Edit User'}></Head>
            <UserEdit user={user}></UserEdit>
        </AdminLayout>
    )
};

export default AdministratorEdit;
