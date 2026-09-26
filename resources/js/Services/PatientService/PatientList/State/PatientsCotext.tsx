import PatientProps from "@/Services/PatientService/PatientList/Interfaces/PatientProps";
import PatientHeader from "@/models/patient/PatientHeader";
import React from "react";

const initialState: PatientProps = {
    patients: [] as PatientHeader [],
    limit: '0',
    offset: 0,
    search: '',
    count: 0,
    next: () => {},
    loading: false,
    changeLimit: (val: string) => {},
    onSearch: (val: string) => {},
    // activate?: (id: number, status: boolean) => {},

}

const PatientsContext = React.createContext(initialState);

const PatientsProvider: React.FC<React.PropsWithChildren<{value: PatientProps}>> = ({value, children}) => {
    return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>;
}

const usePatientContext = () => {
    const context = React.useContext(PatientsContext);
    if (context === undefined) {
        throw new Error('The context should be inside the provider!');
    }

    return context;
}

export { PatientsProvider, usePatientContext };
