import React from "react";
import { Container as ServiceContainer } from "typedi";
import "typedi";
import DeviceTypeService from "@/Services/DeviceTypeService/DeviceTypeService";
import CommonService from "@/Services/CommonService/CommonService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import DeviceType from "@/models/device/DeviceType";
import { DeviceTypeProvider } from "@/Services/DeviceTypeService/State/DeviceTypeContext";
import DeviceTypeGrid from "@/Services/DeviceTypeService/State/DeviceTypeGrid";

const DeviceTypeContainer: React.FC<{ deviceTypes: DeviceType[], count: number }> = ({ deviceTypes, count }) => {
    const [currentDeviceTypes, setCurrentDeviceTypes] = React.useState<DeviceType[]>(deviceTypes);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [limit, setLimit] = React.useState<string>(CommonService.FetchList[0]);
    const deviceTypeService = ServiceContainer.get(DeviceTypeService);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const changeLimit = (val: string) => {
        setLimit(val);
    };

    const toggleActive = (id: number) => {
        setLoading(true);
        deviceTypeService.toggleActive(id)
            .then(response => {
                setCurrentDeviceTypes(currentDeviceTypes.map(item => {
                    if (item.id === response.data.deviceType.id) {
                        return new DeviceType(response.data.deviceType);
                    }
                    return item;
                }));
                setSnackbar({
                    open: true,
                    message: `Device Type status updated successfully!`,
                    severity: "success"
                });
            })
            .catch(error => {
                setSnackbar({
                    open: true,
                    message: `Error happened while updating device type status!`,
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
        <DeviceTypeProvider
            value={{
                deviceTypes: currentDeviceTypes,
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
            <DeviceTypeGrid />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </DeviceTypeProvider>
    );
};

export default DeviceTypeContainer;
