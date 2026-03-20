import { type MenuData, type NavItem } from '@/types/navigation'
import { http, HttpResponse } from 'msw'
import { getUserByToken } from './auth'

const menuData: MenuData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: 'LayoutDashboard',
          permission: 'dashboard:access',
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: 'ListTodo',
          permission: 'tasks:access',
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: 'Package',
          permission: 'apps:access',
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: 'MessagesSquare',
          permission: 'chats:access',
        },
        {
          title: 'Users',
          url: '/users',
          icon: 'Users',
          permission: 'users:access',
        },
        {
          title: 'Permissions',
          url: '/permissions',
          icon: 'Shield',
          permission: 'permissions:access',
        },
        {
          title: 'Products',
          url: '/products',
          icon: 'shopping-cart',
          permission: 'products:access',
        },
        {
          title: 'Surveys',
          url: '/surveys',
          icon: 'LayoutTemplate',
          permission: 'surveys:access',
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
          permission: 'settings:access',
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
          title: 'Components Demo',
          url: '/components-demo/file-upload',
          icon: 'Package',
          permission: 'components-demo:access',
          items: [
            {
              title: 'File Upload',
              url: '/components-demo/file-upload',
              icon: 'Upload',
            },
            {
              title: 'Editor',
              url: '/components-demo/editor',
              icon: 'Edit',
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
          permission: 'help-center:access',
        },
      ],
    },
  ],
}

function hasPermission(item: NavItem, userPermissions: readonly string[]): boolean {
  if (userPermissions.includes('*')) return true
  
  if (item.permission) {
    return userPermissions.includes(item.permission)
  }
  
  return true 
}

function filterMenu(groups: MenuData['navGroups'], permissions: readonly string[]): MenuData['navGroups'] {
  // Deep clone to avoid mutating the original
  const clonedGroups = JSON.parse(JSON.stringify(groups)) as MenuData['navGroups']

  return clonedGroups.map(group => {
    const filterItems = (items: NavItem[]): NavItem[] => {
      return items.filter(item => {
        if (!hasPermission(item, permissions)) {
          return false
        }
        if (item.items) {
          item.items = filterItems(item.items)
          if (item.items.length === 0 && !item.url) return false
        }
        return true
      })
    }
    
    return {
      ...group,
      items: filterItems(group.items)
    }
  }).filter(group => group.items.length > 0)
}

export const menuHandlers = [
  http.get('/api/menu', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : ''
    const user = getUserByToken(token)

    if (!user) {
      return HttpResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 })
    }

    const filteredMenu = filterMenu(menuData.navGroups, user.user.permissions)
    return HttpResponse.json({ navGroups: filteredMenu })
  }),
]
