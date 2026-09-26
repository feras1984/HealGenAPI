import React, { createContext, useContext } from "react";
import { SupervisorContextType } from "@/Services/SupervisorService/Interfaces/SupervisorProps";

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

export const SupervisorProvider: React.FC<{
    value: SupervisorContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <SupervisorContext.Provider value={value}>
            {children}
        </SupervisorContext.Provider>
    );
};

export const useSupervisorContext = (): SupervisorContextType => {
    const context = useContext(SupervisorContext);
    if (!context) {
        throw new Error("useSupervisorContext must be used within a SupervisorProvider");
    }
    return context;
};

export default SupervisorContext;
