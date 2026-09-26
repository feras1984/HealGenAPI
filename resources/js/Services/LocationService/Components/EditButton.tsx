import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import { Link } from "@inertiajs/react";
import { LocationGridProps } from "@/Services/LocationService/Interfaces/LocationProps";

const EditButton = (props: LocationGridProps) => {
    return (
        <Link href={`/locations/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
