import React from "react";
import { Snackbar } from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import CustomSnackbarProps from "@/Interfaces/CustomSnackbarProps";

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
    message,
    open,
    onClose,
    severity = 'info',
    autoHideDuration = 4000,
    anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
    ...rest
}) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            anchorOrigin={anchorOrigin}
            onClose={onClose}
            {...rest}
        >
            <MuiAlert
                elevation={6}
                variant="filled"
                severity={severity}
                onClose={onClose as any}
                sx={{
                    width: '100%',
                    fontWeight: 500,
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                }}
            >
                {message}
            </MuiAlert>
        </Snackbar>
    );
};

export default CustomSnackbar;
