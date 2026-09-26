import React from 'react';
import PatientHeader from "@/models/patient/PatientHeader";
import {Head} from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import PatientContainer from "@/Services/PatientService/PatientList/State/PatientContainer";

const PatientList: React.FC<{patients: PatientHeader[]}> = ({patients}) => {
    return (
        <AdminLayout>
            <Head title="Patients"></Head>
            <PatientContainer patients={patients} count={patients.length}></PatientContainer>
        </AdminLayout>
    );
};

export default PatientList;
