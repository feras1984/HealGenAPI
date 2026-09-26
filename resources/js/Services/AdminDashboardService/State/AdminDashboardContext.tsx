import React, { createContext, useContext } from "react";
import { AdminDashboardContextType } from "@/Services/AdminDashboardService/Interfaces/AdminDashboardProps";

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

export const AdminDashboardProvider: React.FC<{
    value: AdminDashboardContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <AdminDashboardContext.Provider value={value}>
            {children}
        </AdminDashboardContext.Provider>
    );
};

export const useAdminDashboardContext = (): AdminDashboardContextType => {
    const context = useContext(AdminDashboardContext);
    if (!context) {
        throw new Error("useAdminDashboardContext must be used within an AdminDashboardProvider");
    }
    return context;
};

export default AdminDashboardContext;
