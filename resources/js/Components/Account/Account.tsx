import React, {useEffect, useState} from "react";
import styles from "./styles.module.scss";
import {
    Avatar,
    Button,
    Menu,
    MenuItem,
    IconButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
} from "@mui/material";
import {grey} from "@mui/material/colors";
import CustomIcon from "@/Components/Icon/Icon";
import {Link, useForm} from "@inertiajs/react";
import UploadImage from "@/Components/UploadImage/UploadImage";
import {useAppSelector, useAppDispatch} from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

const Account = () => {
    //TODO: change CustomIcon with UploadImage
    const {post} = useForm();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const user = useAppSelector(state => {
        return state.user.user
    });

    useEffect(() => {

    }, [user]);

    const logout = () => {
        post(route('logout'));
    }
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {

    }, [])
    return (
        <div>
            <Avatar sx={{ bgcolor: grey[500] }}>
                <IconButton
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    sx={{color: 'white'}}
                >
                    {/*<CustomIcon name="account"></CustomIcon>*/}
                    <Box className="h-[40px] w-[40px] rounded-full flex justify-center items-center">
                        <UploadImage image={`/file/users/${user.avatar}`} className="h-[40px] w-[40px] rounded-full"/>
                        {/*<CustomIcon name="account"/>*/}
                    </Box>
                </IconButton>
            </Avatar>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {user?.email && (
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                            {user.name || user.firstName || (user.email === 'michael@email.com' ? 'مايكل بينيت' : user.email)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user.email}
                        </Typography>
                    </Box>
                )}
                {user?.email && <Divider sx={{ my: 0.5 }} />}
                <MenuItem>
                    <ListItemIcon className="mr-1">
                        <CustomIcon name="account"></CustomIcon>
                    </ListItemIcon>
                    <Link href={route('admin.profile.edit')} style={{ color: 'inherit', textDecoration: 'none', width: '100%' }}>
                        {t('header.profile') || 'Profile'}
                    </Link>
                </MenuItem>
                <MenuItem onClick={logout}>
                    <ListItemIcon>
                        <CustomIcon name="logout"></CustomIcon>
                    </ListItemIcon>
                    <ListItemText>{t('common.logout') || 'Logout'}</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
}

export default Account;
