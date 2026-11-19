import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { DeviceGridProps } from "@/Services/DeviceService/Interfaces/DeviceProps";
import { useTranslation } from "react-i18next";

const EditButton = (props: DeviceGridProps) => {
    const { i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    return (
        <Link href={`/${activeLang}/devices/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
