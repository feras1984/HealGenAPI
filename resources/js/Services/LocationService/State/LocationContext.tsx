import LocationProps from "@/Services/LocationService/Interfaces/LocationProps";
import React from "react";

const initialState: LocationProps = {
    locations: [],
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

const LocationContext = React.createContext<LocationProps>(initialState);

const LocationProvider: React.FC<React.PropsWithChildren<{ value: LocationProps }>> = ({ children, value }) => {
    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

const useLocationContext = () => {
    const context = React.useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocationContext must be used as a LocationProvider');
    }
    return context;
};

export { useLocationContext, LocationProvider };
