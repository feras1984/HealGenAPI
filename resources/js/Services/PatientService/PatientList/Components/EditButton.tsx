import React from 'react';
import CustomButton from "@/Components/Button/CustomButton";
import {Link} from "@inertiajs/react";
import {PatientGridProps} from "@/Services/PatientService/PatientList/Interfaces/PatientProps";
// import {BlockGridProps} from "../../Interfaces";

const EditButton = (props: PatientGridProps) => {
    return (
        <Link href={`/tests/${props.id}`}>
            <CustomButton task='display' text=""></CustomButton>
        </Link>
    );
};

export default EditButton;
