import React from 'react';
import Brightness1Icon from "@mui/icons-material/Brightness1";
import {IconButton} from "@mui/material";
// import {BlockGridProps} from "../../Interfaces";
// import {useBlocksContext} from "../BlocksContext";
import {AdminGridProps} from "@/Services/UserService/Interfaces/AdminProps";

const ActiveForm = (props: AdminGridProps) => {
    // const {activate, loading} = useBlocksContext();
    // const handleClick = () => {
    //     if (activate) {
    //         activate(props.id, !props.isActive);
    //     }
    // }
    return (
        // <IconButton onClick={handleClick} disabled={loading}>
        //     <Brightness1Icon color={props.isActive? "activate": "deactivate"}></Brightness1Icon>
        // </IconButton>
        <Brightness1Icon color={props.isActive? "activate": "deactivate"}></Brightness1Icon>

    );
};

export default ActiveForm;
