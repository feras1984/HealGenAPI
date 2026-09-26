import React from 'react';
import {Avatar, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import "reflect-metadata";
import {AdminGridProps} from "@/Services/UserService/Interfaces/AdminProps";
// import {BlockGridProps} from "../../Interfaces";

const ImageTemplate = (props: AdminGridProps) => {
    return (
        <ListItem sx={{padding: 0}}>
            <ListItemAvatar>
                <Avatar src={`/file/users/${props.avatar}`} />
            </ListItemAvatar>
            <ListItemText primary={props.name} secondary={props.createdAt} />
        </ListItem>
    );
};

export default ImageTemplate;
