import Styles from "@/Components/Site/Header/Styles";
import {Box, Icon} from "@mui/material";
import {FacebookOutlined} from "@mui/icons-material";
// import {FaFacebook} from "react-icons/fa";
import styles from "./Styles";
import {IconButton} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SocialIcon from "@/Components/Site/SocialIcon/SocialIcon";
import LanguageMenu from "@/Components/Site/LanguageMenu/LanguageMenu";
import MenuLink from "@/models/Link/MenuLink";
import Language from "@/models/language/Language";
import React from "react";
import HeaderProps from "@/Interfaces/Site/HeaderProps";
import NavBar from "@/Components/Site/Header/NavBar/NavBar";
import NavDrawer from "@/Components/Site/Header/NavDrawer/NavDrawer";
import {useAppDispatch, useAppSelector} from "@/Redux/Store/hook";
import {setSiteMode} from "@/Redux/Reducers/ThemeSlice/SiteThemeSlice";
const Header:React.FC = () =>
{
    const dispatch = useAppDispatch();
    const dark = useAppSelector(state => state.siteTheme.dark);

    const handleTheme = () => {
        dark ? dispatch(setSiteMode(false)) : dispatch(setSiteMode(true));
    }
    return(
        <>
            <Box className="displayLg">
                <NavBar />
            </Box>

            <Box className="displayMd">
                <NavDrawer/>
            </Box>
        </>




    );
}

export default Header;
