import React from "react";
import { Container as ServiceContainer } from "typedi";
import "typedi";
import DeviceUserService from "@/Services/DeviceUserService/DeviceUserService";
import CommonService from "@/Services/CommonService/CommonService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import DeviceUser from "@/models/device/DeviceUser";
import { DeviceUserProvider } from "@/Services/DeviceUserService/State/DeviceUserContext";
import DeviceUserGrid from "@/Services/DeviceUserService/State/DeviceUserGrid";

const DeviceUserContainer: React.FC<{ assignments: DeviceUser[], count: number }> = ({ assignments, count }) => {
    const [currentAssignments, setCurrentAssignments] = React.useState<DeviceUser[]>(assignments);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [limit, setLimit] = React.useState<string>(CommonService.FetchList[0]);
    const deviceUserService = ServiceContainer.get(DeviceUserService);

    const { snackbar, setSnackbar, handleClose } =
        useSnackbarHook({ open: false, message: '', severity: "success" });

    const changeLimit = (val: string) => {
        setLimit(val);
    };

    const unassign = (id: number) => {
        setLoading(true);
        deviceUserService.unassignDevice(id)
            .then(response => {
                setCurrentAssignments(currentAssignments.map(item => {
                    if (item.id === response.data.assignment.id) {
                        return new DeviceUser(response.data.assignment);
                    }
                    return item;
                }));
                setSnackbar({
                    open: true,
                    message: `Device unassigned from user successfully!`,
                    severity: "success"
                });
            })
            .catch(error => {
                setSnackbar({
                    open: true,
                    message: `Error happened while unassigning device!`,
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const reassign = (id: number) => {
        setLoading(true);
        deviceUserService.reassignDevice(id)
            .then(response => {
                setCurrentAssignments(currentAssignments.map(item => {
                    if (item.id === response.data.assignment.id) {
                        return new DeviceUser(response.data.assignment);
                    }
                    return item;
                }));
                setSnackbar({
                    open: true,
                    message: `Device reassigned to user successfully!`,
                    severity: "success"
                });
            })
            .catch(error => {
                setSnackbar({
                    open: true,
                    message: `Error happened while reassigning device!`,
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
        <DeviceUserProvider
            value={{
                assignments: currentAssignments,
                limit,
                offset: 0,
                search: '',
                count,
                next,
                loading,
                changeLimit,
                onSearch,
                unassign,
                reassign,
            }}
        >
            <DeviceUserGrid />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </DeviceUserProvider>
    );
};

export default DeviceUserContainer;
