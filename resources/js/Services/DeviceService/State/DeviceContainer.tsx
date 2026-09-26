import React from "react";
import { Container as ServiceContainer } from "typedi";
import "typedi";
import DeviceService from "@/Services/DeviceService/DeviceService";
import CommonService from "@/Services/CommonService/CommonService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import Device from "@/models/device/Device";
import { DeviceProvider } from "@/Services/DeviceService/State/DeviceContext";
import DeviceGrid from "@/Services/DeviceService/State/DeviceGrid";

const DeviceContainer: React.FC<{ devices: Device[], count: number }> = ({ devices, count }) => {
    const [currentDevices, setCurrentDevices] = React.useState<Device[]>(devices);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [limit, setLimit] = React.useState<string>(CommonService.FetchList[0]);
    const deviceService = ServiceContainer.get(DeviceService);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const changeLimit = (val: string) => {
        setLimit(val);
    };

    const toggleActive = (id: number) => {
        setLoading(true);
        deviceService.toggleActive(id)
            .then(response => {
                setCurrentDevices(currentDevices.map(item => {
                    if (item.id === response.data.device.id) {
                        return new Device(response.data.device);
                    }
                    return item;
                }));
                setSnackbar({
                    open: true,
                    message: `Device status updated successfully!`,
                    severity: "success"
                });
            })
            .catch(error => {
                setSnackbar({
                    open: true,
                    message: `Error happened while updating device status!`,
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
        <DeviceProvider
            value={{
                devices: currentDevices,
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
            <DeviceGrid />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </DeviceProvider>
    );
};

export default DeviceContainer;
