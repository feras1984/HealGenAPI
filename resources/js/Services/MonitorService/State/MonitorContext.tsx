import React, { createContext, useContext } from "react";
import { MonitorContextType } from "@/Services/MonitorService/Interfaces/MonitorProps";

const MonitorContext = createContext<MonitorContextType | undefined>(undefined);

export const MonitorProvider: React.FC<{
    value: MonitorContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <MonitorContext.Provider value={value}>
            {children}
        </MonitorContext.Provider>
    );
};

export const useMonitorContext = (): MonitorContextType => {
    const context = useContext(MonitorContext);
    if (!context) {
        throw new Error("useMonitorContext must be used within a MonitorProvider");
    }
    return context;
};

export default MonitorContext;
