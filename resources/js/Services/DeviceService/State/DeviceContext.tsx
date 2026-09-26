import DeviceProps from "@/Services/DeviceService/Interfaces/DeviceProps";
import React from "react";

const initialState: DeviceProps = {
    devices: [],
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

const DeviceContext = React.createContext<DeviceProps>(initialState);

const DeviceProvider: React.FC<React.PropsWithChildren<{ value: DeviceProps }>> = ({ children, value }) => {
    return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

const useDeviceContext = () => {
    const context = React.useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDeviceContext must be used as a DeviceProvider');
    }
    return context;
};

export { useDeviceContext, DeviceProvider };
