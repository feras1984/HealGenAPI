import React from 'react';
import Brightness1Icon from "@mui/icons-material/Brightness1";
import { DeviceUserGridProps } from "@/Services/DeviceUserService/Interfaces/DeviceUserProps";

const ActiveForm = (props: DeviceUserGridProps) => {
    return (
        <Brightness1Icon color={props.isActive ? "activate" : "deactivate"} />
    );
};

export default ActiveForm;
