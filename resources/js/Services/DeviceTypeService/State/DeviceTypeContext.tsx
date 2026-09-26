import DeviceTypeProps from "@/Services/DeviceTypeService/Interfaces/DeviceTypeProps";
import React from "react";

const initialState: DeviceTypeProps = {
    deviceTypes: [],
    count: 0,
    limit: "",
    offset: 0,
    loading: false,
    search: "",
    changeLimit(val: string): void {},
    next(): void {},
    onSearch(val: string): void {},
    toggleActive(id: number): void {},
};

const DeviceTypeContext = React.createContext<DeviceTypeProps>(initialState);

const DeviceTypeProvider: React.FC<React.PropsWithChildren<{ value: DeviceTypeProps }>> = ({ children, value }) => {
    return <DeviceTypeContext.Provider value={value}>{children}</DeviceTypeContext.Provider>;
};

const useDeviceTypeContext = () => {
    const context = React.useContext(DeviceTypeContext);
    if (context === undefined) {
        throw new Error('useDeviceTypeContext must be used as a DeviceTypeProvider');
    }
    return context;
};

export { useDeviceTypeContext, DeviceTypeProvider };
