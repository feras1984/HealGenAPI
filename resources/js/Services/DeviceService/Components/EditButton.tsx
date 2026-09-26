import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { DeviceGridProps } from "@/Services/DeviceService/Interfaces/DeviceProps";

const EditButton = (props: DeviceGridProps) => {
    return (
        <Link href={`/devices/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
