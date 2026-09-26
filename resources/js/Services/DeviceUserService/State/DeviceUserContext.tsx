import DeviceUserProps from "@/Services/DeviceUserService/Interfaces/DeviceUserProps";
import React from "react";

const initialState: DeviceUserProps = {
    assignments: [],
    count: 0,
    limit: "",
    offset: 0,
    loading: false,
    search: "",
    changeLimit(val: string): void {},
    next(): void {},
    onSearch(val: string): void {},
    unassign(id: number): void {},
    reassign(id: number): void {},
};

const DeviceUserContext = React.createContext<DeviceUserProps>(initialState);

const DeviceUserProvider: React.FC<React.PropsWithChildren<{ value: DeviceUserProps }>> = ({ children, value }) => {
    return <DeviceUserContext.Provider value={value}>{children}</DeviceUserContext.Provider>;
};

const useDeviceUserContext = () => {
    const context = React.useContext(DeviceUserContext);
    if (context === undefined) {
        throw new Error('useDeviceUserContext must be used as a DeviceUserProvider');
    }
    return context;
};

export { useDeviceUserContext, DeviceUserProvider };
