import {SnackbarProps, AlertColor} from "@mui/material";

interface CustomSnackbarProps extends SnackbarProps {
    message: string;
    severity?: AlertColor | "success" | "error" | "info" | "warning";
}

export default CustomSnackbarProps;
