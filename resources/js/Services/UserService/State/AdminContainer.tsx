import React from "react";
import {Container as ServiceContainer} from "typedi";
import "typedi";
import AdminService from "@/Services/UserService/AdminService";
import CommonService from "@/Services/CommonService/CommonService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import Administrator from "@/models/User/Administrator";
import {AdminProvider} from "@/Services/UserService/State/AdminsContext";
import AdminGrid from "@/Services/UserService/State/AdminGrid";

const AdminContainer: React.FC<{admins: Administrator [], count: number}> = ({admins, count}) => {
    const [currentAdmins, setCurrentAdmins] = React.useState<Administrator []>(admins);
    const [localeAdmins, setLocaleAdmins] = React.useState<Administrator []>(admins);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [search, setSearch] = React.useState<string>('');
    const adminService = ServiceContainer.get(AdminService);
    const [limit, setLimit] = React.useState<string>(CommonService.FetchList[0]);

    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================

    const changeLimit = (val: string) => {
        setLimit(val);
    }
    // const activate = (id: number, status: boolean) => {
    //     const formData = new FormData();
    //     formData.append('isActive', status ? 'true' : 'false');
    //     blockService.blockActivation(formData, id)
    //         .then(response => {
    //             setCurrentBlocks(currentBlocks.map(block => {
    //                 if (block.id === response.data.id) return response.data;
    //                 else return block;
    //             }));
    //             setLocaleBlocks(localeBlocks.map(block => {
    //                 if (block.id === response.data.id) return response.data;
    //                 else return block;
    //             }));
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true,
    //                     message: `Block set as ${response.data.isActive ? 'Active' : 'Inactive'} `,
    //                     severity: "success"
    //                 })
    //             );
    //         })
    //         .catch(error => {
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true,
    //                     message: `Error happened while changing block status!`,
    //                     severity: "error"
    //                 })
    //             );
    //             console.log(error);
    //         })
    //     ;
    // }

    // const deleteFn = (id: number, category?: string) => {
    //     const formData = new FormData();
    //     if (category) {
    //         formData.append('category', category);
    //     }
    //     blockService.deleteBlock(id, formData)
    //         .then(() => {
    //             setCurrentBlocks(currentBlocks.filter(block => block.id !== id));
    //             setLocaleBlocks(localeBlocks.filter(block => block.id !== id));
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Block has been deleted!', severity: "success" })
    //             );
    //         })
    //         .catch(error => {
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Error Happened while deleting block!', severity: "error" })
    //             );
    //         })
    // }

    // const reorder = (data: OrderData []) => {
    //     const formData = new FormData();
    //     formData.append('list', JSON.stringify(data));
    //     blockService.reorder(formData)
    //         .then(() => {
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Blocks has been ordered!', severity: "success" })
    //             );
    //         })
    //         .catch((error) => {
    //             console.log(error);
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Error Happened while reordering blocks!', severity: "error" })
    //             );
    //         })
    // }

    const onSearch = (val: string) => {
        // setSearch(val);
        // if (val.length === 0) {
        //     setTimeout(() => {
        //         setCurrentCustomers(localeCustomers);
        //     })
        // }
        // if (val.length > 2) {
        //     setLoading(true);
        //
        //     customerService.getCustomers(
        //         {
        //             key: 'search',
        //             value: val,
        //         },
        //     )
        //         .then(response => {
        //             setLoading(false);
        //             setCurrentCustomers(response.data);
        //         }).catch(error => {
        //         console.log(error);
        //         setLoading(false);
        //     })
        // }
    }

    const next = () => {
        // setLoading(true);
        // // setLocaleCustomers(currentCustomers);
        // customerService.getCustomers(
        //     {
        //         key: 'limit',
        //         value: limit,
        //     },
        //     {
        //         key: 'offset',
        //         value: localeCustomers.length,
        //     }
        // )
        //     .then(response => {
        //         setLoading(false);
        //         setCurrentCustomers(localeCustomers.concat(response.data));
        //         setLocaleCustomers(localeCustomers.concat(response.data));
        //     }).catch(error => {
        //     console.log(error);
        //     setLoading(false);
        // })
    }



    return (
        <AdminProvider
            value={{
                admins: currentAdmins,
                limit,
                offset: 0,
                search: '',
                count, next,
                loading: loading,
                changeLimit,
                onSearch,
                // activate,
                // deleteFn,
                // reorder,
            }}
        >
            <AdminGrid />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </AdminProvider>
    );
}

export default AdminContainer;
