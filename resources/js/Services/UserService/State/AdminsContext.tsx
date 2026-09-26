import AdminProps from "@/Services/UserService/Interfaces/AdminProps";
import React from "react";

const initialState : AdminProps = {
    activate(id: number, status: boolean): void {},
    admins: [],
    changeLimit(val: string): void {},
    count: 0,
    limit: "",
    loading: false,
    next(): void {},
    offset: 0,
    onSearch(val: string): void {},
    search: ""
}

const AdminsContext = React.createContext<AdminProps>(initialState)

const AdminProvider: React.FC<React.PropsWithChildren<{value: AdminProps}>> = ({children, value}) => {
    return <AdminsContext.Provider value={value}>{children}</AdminsContext.Provider>
}

const useAdminContext = () => {
    const context = React.useContext(AdminsContext);
    if (context === undefined) {
        throw new Error('useAdminContext must be used as an AdminProvider');
    }
    return context;
}

export { useAdminContext, AdminProvider };
