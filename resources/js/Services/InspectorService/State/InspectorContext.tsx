import React, { createContext, useContext } from "react";
import { InspectorContextType } from "@/Services/InspectorService/Interfaces/InspectorProps";

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export const InspectorProvider: React.FC<{
    value: InspectorContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <InspectorContext.Provider value={value}>
            {children}
        </InspectorContext.Provider>
    );
};

export const useInspectorContext = (): InspectorContextType => {
    const context = useContext(InspectorContext);
    if (!context) {
        throw new Error("useInspectorContext must be used within an InspectorProvider");
    }
    return context;
};

export default InspectorContext;
