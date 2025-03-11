import {
  ListCheckIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  BellIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PaletteIcon,
  SettingsIcon,
  WrenchIcon,
  UserCogIcon,
  UsersIcon,
  MonitorCogIcon,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboardIcon,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListCheckIcon,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: PackageIcon,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessageSquareIcon,
        },
        {
          title: 'Users',
          url: '/users',
          icon: UsersIcon,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: SettingsIcon,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCogIcon,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: WrenchIcon,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: PaletteIcon,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: BellIcon,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: MonitorCogIcon,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircleIcon,
        },
      ],
    },
  ],
}
