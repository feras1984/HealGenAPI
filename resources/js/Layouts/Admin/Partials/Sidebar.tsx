import React, {useEffect, useState} from "react";
import styles from "./styles.module.scss";

import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import SendIcon from '@mui/icons-material/Send';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarBorder from '@mui/icons-material/StarBorder';
import SidebarList, {CustomTab} from "./SidebarList";
import Icon from "@/Components/Icon/Icon";
import {Box, Typography, Divider} from "@mui/material";
import {Link, usePage, router} from "@inertiajs/react";

const Sidebar: React.FC<{expand: boolean}> = ({expand}) => {
    const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

    const pageProps = usePage().props as any;
    const currentUser = pageProps.auth?.user || pageProps.user;
    const userRole = (currentUser?.role || currentUser?.reference?.role || 'administrator').toLowerCase();

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const filterTabsByRole = (tabs: CustomTab[], role: string): CustomTab[] => {
        return tabs
            .filter(tab => {
                if (role === 'administrator') return true;
                if (!tab.roles || tab.roles.length === 0) return true;
                return tab.roles.includes(role);
            })
            .map(tab => ({
                ...tab,
                children: tab.children ? filterTabsByRole(tab.children, role) : []
            }));
    };

    const allowedTabs = filterTabsByRole(SidebarList, userRole);

    const generateTabs = (tabs: CustomTab [], level = 0) => {
        const offset = 2 * level;

        return (
            tabs.map((tab, index) =>
            {
                const [open, setOpen] = useState<boolean>(false);
                const [expand, setExpand] = useState<string>('forward');
                const handleClick = () => {
                    setOpen(!open);
                    setExpand((expand) => expand === 'forward' ? 'expand-more' : 'forward');
                }
                return (
                    <Box key={index}>

                        {
                            tab.children.length === 0 ?
                                <Link href={tab.link}>
                                    <ListItemButton sx={{pl: offset, pr: 0}} onClick={() => {tab.children.length > 0 ? handleClick() : null}}>
                                        <ListItemIcon>
                                            <Icon name={tab.icon}></Icon>
                                        </ListItemIcon>
                                        <ListItemText primary={tab.name} />
                                        {(tab.children.length > 0) && <Icon name={expand}></Icon>}
                                    </ListItemButton>
                                </Link>
                                :
                                <>
                                <ListItemButton sx={{pl: offset, pr: 0}} onClick={() => {tab.children.length > 0 ? handleClick() : null}}>
                                    <ListItemIcon>
                                        <Icon name={tab.icon}></Icon>
                                    </ListItemIcon>
                                    <ListItemText primary={tab.name} />
                                    {(tab.children.length > 0) && <Icon name={expand}></Icon>}
                                </ListItemButton>
                                {tab.children.length > 0 && (
                                    <Collapse in={open} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {generateTabs(tab.children, level + 1)}
                                        </List>
                                    </Collapse>
                                )}
                                </>
                        }
                    </Box>
                )
            }));
    }

    return (
        <List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
            <>
                <ListSubheader component="div" id="nested-list-subheader" sx={{height: '44px'}}>
                    <Typography variant="body2" sx={{fontWeight: 700}}>
                        {appName}
                    </Typography>
                </ListSubheader>
                <Divider />
            </>

            }
        >
            {
                generateTabs(allowedTabs)
            }
            <Divider sx={{ my: 1 }} />
            <ListItemButton onClick={handleLogout} sx={{ pl: 0, pr: 0 }}>
                <ListItemIcon>
                    <Icon name="logout"></Icon>
                </ListItemIcon>
                <ListItemText primary="Logout" />
            </ListItemButton>
        </List>
    );
}

export default Sidebar;
