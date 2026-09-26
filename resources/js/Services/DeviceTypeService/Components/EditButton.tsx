import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { DeviceTypeGridProps } from "@/Services/DeviceTypeService/Interfaces/DeviceTypeProps";

const EditButton = (props: DeviceTypeGridProps) => {
    return (
        <Link href={`/device-types/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
