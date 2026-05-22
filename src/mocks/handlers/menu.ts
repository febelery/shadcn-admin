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
          title: 'Task',
          url: '/task',
          icon: 'ListTodo',
          permission: 'task:access',
        },
        {
          title: 'App',
          url: '/app',
          icon: 'Package',
          permission: 'app:access',
        },
        {
          title: 'Chat',
          url: '/chat',
          badge: '3',
          icon: 'MessagesSquare',
          permission: 'chat:access',
        },
        {
          title: 'User',
          url: '/user',
          icon: 'Users',
          permission: 'user:access',
        },
        {
          title: 'Permission',
          url: '/permission',
          icon: 'Shield',
          permission: 'permission:access',
        },
        {
          title: 'Product',
          url: '/product',
          icon: 'shopping-cart',
          permission: 'product:access',
        },
        {
          title: 'Survey',
          url: '/survey',
          icon: 'LayoutTemplate',
          permission: 'survey:access',
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
          title: 'Error',
          icon: 'Bug',
          items: [
            {
              title: 'Unauthorized',
              url: '/error/unauthorized',
              icon: 'Lock',
            },
            {
              title: 'Forbidden',
              url: '/error/forbidden',
              icon: 'UserX',
            },
            {
              title: 'Not Found',
              url: '/error/not-found',
              icon: 'FileX',
            },
            {
              title: 'Internal Server Error',
              url: '/error/internal-server-error',
              icon: 'ServerOff',
            },
            {
              title: 'Maintenance Error',
              url: '/error/maintenance-error',
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
          title: 'Setting',
          icon: 'Settings',
          permission: 'setting:access',
          items: [
            {
              title: 'Profile',
              url: '/setting',
              icon: 'UserCog',
            },
            {
              title: 'Account',
              url: '/setting/account',
              icon: 'Wrench',
            },
            {
              title: 'Appearance',
              url: '/setting/appearance',
              icon: 'Palette',
            },
            {
              title: 'Notification',
              url: '/setting/notification',
              icon: 'Bell',
            },
            {
              title: 'Display',
              url: '/setting/display',
              icon: 'Monitor',
            },
          ],
        },
        {
          title: 'Component Demo',
          url: '/component-demo/file-upload',
          icon: 'Package',
          permission: 'component-demo:access',
          items: [
            {
              title: 'File Upload',
              url: '/component-demo/file-upload',
              icon: 'Upload',
            },
            {
              title: 'Editor',
              url: '/component-demo/editor',
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

function hasPermission(
  item: NavItem,
  userPermissions: readonly string[]
): boolean {
  if (userPermissions.includes('*')) return true

  if (item.permission) {
    return userPermissions.includes(item.permission)
  }

  return true
}

function filterMenu(
  groups: MenuData['navGroups'],
  permissions: readonly string[]
): MenuData['navGroups'] {
  // Deep clone to avoid mutating the original
  const clonedGroups = JSON.parse(
    JSON.stringify(groups)
  ) as MenuData['navGroups']

  return clonedGroups
    .map((group) => {
      const filterItems = (items: NavItem[]): NavItem[] => {
        return items.filter((item) => {
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
        items: filterItems(group.items),
      }
    })
    .filter((group) => group.items.length > 0)
}

export const menuHandlers = [
  http.get('/api/menu', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : ''
    const user = getUserByToken(token)

    if (!user) {
      return HttpResponse.json(
        { code: 401, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    const filteredMenu = filterMenu(menuData.navGroups, user.user.permissions)
    return HttpResponse.json({ navGroups: filteredMenu })
  }),
]
