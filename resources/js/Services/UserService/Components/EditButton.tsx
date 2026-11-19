import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { AdminGridProps } from "@/Services/UserService/Interfaces/AdminProps";
import { useTranslation } from "react-i18next";

const EditButton = (props: AdminGridProps) => {
    const { i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    return (
        <Link href={`/${activeLang}/users/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
