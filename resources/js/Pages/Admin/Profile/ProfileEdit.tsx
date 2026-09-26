import React from 'react';
import {Head} from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Administrator from "@/models/User/Administrator";
import AdministratorEdit from "@/Pages/Admin/Users/AdministratorEdit";
import UserEdit from "@/Pages/Admin/Shared/UserEdit";

const ProfileEdit: React.FC<{user: Administrator}> = ({user}) => {
    return (
        <AdminLayout>
            <Head title="Profile"></Head>
            <UserEdit user={user} enabled={false}></UserEdit>
        </AdminLayout>
    );
};

export default ProfileEdit;
