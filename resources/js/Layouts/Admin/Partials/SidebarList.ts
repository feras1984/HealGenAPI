import BlockCategories from "@/Enums/BlockCategories";
import {Container} from "typedi";
import CommonService from "@/Services/CommonService/CommonService";
import "reflect-metadata";
import MenuCategories from "@/Enums/MenuCategories";

const commonService = Container.get(CommonService);

export type CustomTab = {
    name: string,
    icon: string,
    link: string,
    roles?: string[],
    children: CustomTab [],
};

const SidebarList: CustomTab [] = [
    {
        name: 'Home',
        icon: 'home',
        link: '/',
        roles: ['administrator', 'supervisor', 'inspector', 'employee'],
        children: [],
    },

    {
        name: 'Monitor',
        icon: 'dashboard',
        link: '/monitor',
        roles: ['administrator', 'supervisor', 'inspector'],
        children: [],
    },

    {
        name: 'Inspector Queue',
        icon: 'assignment',
        link: '/inspector/dashboard',
        roles: ['administrator', 'inspector'],
        children: [],
    },

    {
        name: 'Supervisor Queue',
        icon: 'verified',
        link: '/supervisor/dashboard',
        roles: ['administrator', 'supervisor'],
        children: [],
    },

    {
        name: 'Tests',
        icon: 'tests',
        link: '/tests',
        roles: ['administrator', 'supervisor', 'inspector', 'employee'],
        children: [],
    },

    {
        name: 'Users',
        icon: 'users',
        link: '/users',
        roles: ['administrator'],
        children: [],
    },

    {
        name: 'Audit Logs',
        icon: 'assignment',
        link: '/audit-logs',
        roles: ['administrator'],
        children: [],
    },

    {
        name: 'Locations',
        icon: 'location',
        link: '/locations',
        roles: ['administrator'],
        children: [],
    },

    {
        name: 'Devices',
        icon: 'device',
        link: '/devices',
        roles: ['administrator'],
        children: [
            {
                name: 'Device Types',
                icon: 'category',
                link: '/device-types',
                roles: ['administrator'],
                children: [],
            },
            {
                name: 'Devices',
                icon: 'device',
                link: '/devices',
                roles: ['administrator'],
                children: [],
            },
            {
                name: 'Device Assignments',
                icon: 'assignment',
                link: '/device-users',
                roles: ['administrator'],
                children: [],
            },
        ],
    },
];

export default SidebarList;
