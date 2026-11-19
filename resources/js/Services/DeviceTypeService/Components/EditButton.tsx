import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { DeviceTypeGridProps } from "@/Services/DeviceTypeService/Interfaces/DeviceTypeProps";
import { useTranslation } from "react-i18next";

const EditButton = (props: DeviceTypeGridProps) => {
    const { i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    return (
        <Link href={`/${activeLang}/device-types/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
