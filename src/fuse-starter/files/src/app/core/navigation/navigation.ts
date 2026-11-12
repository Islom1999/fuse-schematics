import { UiNavigationItem } from '@ui/navigation/navigation.types';

export const defaultNavigation: UiNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id      : 'system',
        title   : 'System',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id   : 'system-admins',
                title: 'Admins',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/system/admins'
            },
            {
                id   : 'system-roles',
                title: 'Roles',
                type : 'basic',
                icon : 'heroicons_outline:shield-check',
                link : '/system/roles'
            }
        ]
    }
];
export const compactNavigation: UiNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id      : 'system',
        title   : 'System',
        type    : 'aside',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id   : 'system-admins',
                title: 'Admins',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/system/admins'
            },
            {
                id   : 'system-roles',
                title: 'Roles',
                type : 'basic',
                icon : 'heroicons_outline:shield-check',
                link : '/system/roles'
            }
        ]
    }
];
export const futuristicNavigation: UiNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id      : 'system',
        title   : 'System',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id   : 'system-admins',
                title: 'Admins',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/system/admins'
            },
            {
                id   : 'system-roles',
                title: 'Roles',
                type : 'basic',
                icon : 'heroicons_outline:shield-check',
                link : '/system/roles'
            }
        ]
    }
];
export const horizontalNavigation: UiNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    },
    {
        id      : 'system',
        title   : 'System',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id   : 'system-admins',
                title: 'Admins',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/system/admins'
            },
            {
                id   : 'system-roles',
                title: 'Roles',
                type : 'basic',
                icon : 'heroicons_outline:shield-check',
                link : '/system/roles'
            }
        ]
    }
];
