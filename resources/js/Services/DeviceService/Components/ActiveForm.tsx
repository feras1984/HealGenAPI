import React from 'react';
import Brightness1Icon from "@mui/icons-material/Brightness1";
import { IconButton } from "@mui/material";
import { DeviceGridProps } from "@/Services/DeviceService/Interfaces/DeviceProps";
import { useDeviceContext } from "@/Services/DeviceService/State/DeviceContext";

const ActiveForm = (props: DeviceGridProps) => {
    const { toggleActive, loading } = useDeviceContext();
    const handleClick = () => {
        if (toggleActive) {
            toggleActive(props.id);
        }
    };

    return (
        <IconButton onClick={handleClick} disabled={loading}>
            <Brightness1Icon color={props.isActive ? "activate" : "deactivate"} />
        </IconButton>
    );
};

export default ActiveForm;
