import React from 'react';
import Brightness1Icon from "@mui/icons-material/Brightness1";
import { IconButton } from "@mui/material";
import { DeviceTypeGridProps } from "@/Services/DeviceTypeService/Interfaces/DeviceTypeProps";
import { useDeviceTypeContext } from "@/Services/DeviceTypeService/State/DeviceTypeContext";

const ActiveForm = (props: DeviceTypeGridProps) => {
    const { toggleActive, loading } = useDeviceTypeContext();
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
