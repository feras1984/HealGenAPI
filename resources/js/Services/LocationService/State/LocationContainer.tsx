import React from "react";
import { Container as ServiceContainer } from "typedi";
import "typedi";
import LocationService from "@/Services/LocationService/LocationService";
import CommonService from "@/Services/CommonService/CommonService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import Location from "@/models/location/Location";
import { LocationProvider } from "@/Services/LocationService/State/LocationContext";
import LocationGrid from "@/Services/LocationService/State/LocationGrid";

const LocationContainer: React.FC<{ locations: Location[], count: number }> = ({ locations, count }) => {
    const [currentLocations, setCurrentLocations] = React.useState<Location[]>(locations);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [limit, setLimit] = React.useState<string>(CommonService.FetchList[0]);
    const locationService = ServiceContainer.get(LocationService);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const changeLimit = (val: string) => {
        setLimit(val);
    };

    const toggleActive = (id: number) => {
        setLoading(true);
        locationService.toggleActive(id)
            .then(response => {
                setCurrentLocations(currentLocations.map(loc => {
                    if (loc.id === response.data.location.id) {
                        return new Location(response.data.location);
                    }
                    return loc;
                }));
                setSnackbar({
                    open: true,
                    message: `Location status updated successfully!`,
                    severity: "success"
                });
            })
            .catch(error => {
                setSnackbar({
                    open: true,
                    message: `Error happened while updating location status!`,
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onSearch = (val: string) => {};
    const next = () => {};

    return (
        <LocationProvider
            value={{
                locations: currentLocations,
                limit,
                offset: 0,
                search: '',
                count,
                next,
                loading,
                changeLimit,
                onSearch,
                toggleActive,
            }}
        >
            <LocationGrid />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </LocationProvider>
    );
};

export default LocationContainer;
