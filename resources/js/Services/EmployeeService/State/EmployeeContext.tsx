import React, { createContext, useContext } from "react";
import { EmployeeContextType } from "@/Services/EmployeeService/Interfaces/EmployeeProps";

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{
    value: EmployeeContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployeeContext = (): EmployeeContextType => {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error("useEmployeeContext must be used within an EmployeeProvider");
    }
    return context;
};

export default EmployeeContext;
