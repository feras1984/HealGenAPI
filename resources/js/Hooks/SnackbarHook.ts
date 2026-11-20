import React, {useState, useEffect} from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";

export type SnackbarType = {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
};

const useSnackbarHook = (status?: {open?: boolean, message?: string, severity?: SnackbarSeverity}) => {
    const [snackbar, setSnackbar] = useState<SnackbarType>({
        open: status?.open ?? false,
        message: status?.message ?? '',
        severity: status?.severity ?? "success",
    });

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway' || reason === 'timeout' || reason === 'escapeKeyDown') {
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: false, message: '' } )
            );
            return;
        }
        setSnackbar(snackbarState =>
            ({ ...snackbarState, open: false, message: '' } )
        );
    };

    return {snackbar, setSnackbar, handleClose};
};

export default useSnackbarHook;
