import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import {Link} from "@inertiajs/react";
import {AdminGridProps} from "@/Services/UserService/Interfaces/AdminProps";

const EditButton = (props: AdminGridProps) => {
    return (
        <Link href={`/users/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
