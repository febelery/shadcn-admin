import { type MenuData } from '@/types/navigation'
import { http, HttpResponse } from 'msw'

const menuData: MenuData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: 'LayoutDashboard',
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: 'ListTodo',
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: 'Package',
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: 'MessagesSquare',
        },
        {
          title: 'Users',
          url: '/users',
          icon: 'Users',
        },
        {
          title: 'Products',
          url: '/products',
          icon: 'shopping-cart',
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: 'ShieldCheck',
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: 'Bug',
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: 'Lock',
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: 'UserX',
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: 'FileX',
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: 'ServerOff',
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: 'Construction',
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: 'Settings',
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: 'UserCog',
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: 'Wrench',
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: 'Palette',
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: 'Bell',
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: 'Monitor',
            },
          ],
        },
        {
          title: 'Nested Test',
          icon: 'Bug',
          items: [
            {
              title: 'Level 2',
              icon: 'Biohazard',
              items: [
                {
                  title: 'Level 3',
                  url: '/nested/level2/level3',
                  icon: 'Dna',
                },
              ],
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: 'HelpCircle',
        },
      ],
    },
  ],
}

export const menuHandlers = [
  http.get('/api/menu', () => {
    return HttpResponse.json(menuData)
  }),
]
