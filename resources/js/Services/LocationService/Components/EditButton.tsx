import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { LocationGridProps } from "@/Services/LocationService/Interfaces/LocationProps";
import { useTranslation } from "react-i18next";

const EditButton = (props: LocationGridProps) => {
    const { i18n } = useTranslation();
    const activeLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    return (
        <Link href={`/${activeLang}/locations/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
