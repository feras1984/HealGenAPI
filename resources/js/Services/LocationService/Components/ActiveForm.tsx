import React from 'react';
import Brightness1Icon from "@mui/icons-material/Brightness1";
import { IconButton } from "@mui/material";
import { LocationGridProps } from "@/Services/LocationService/Interfaces/LocationProps";
import { useLocationContext } from "@/Services/LocationService/State/LocationContext";

const ActiveForm = (props: LocationGridProps) => {
    const { toggleActive, loading } = useLocationContext();
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
