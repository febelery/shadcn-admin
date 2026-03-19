import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { sleep } from '@/lib/utils'

faker.seed(4567)

/**
 * 角色与权限 Mock 数据
 */

export interface MockRole {
  id: string
  name: string
  label: string
  description: string
  permissions: string[]
  userCount: number
  createdAt: string
  updatedAt: string
}

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard:access', label: '仪表盘', group: '常规' },
  { key: 'tasks:access', label: '任务管理', group: '常规' },
  { key: 'apps:access', label: '应用中心', group: '常规' },
  { key: 'chats:access', label: '聊天', group: '常规' },
  { key: 'users:access', label: '用户管理', group: '常规' },
  { key: 'products:access', label: '产品管理', group: '常规' },
  { key: 'permissions:access', label: '权限管理', group: '系统' },
  { key: 'settings:access', label: '系统设置', group: '系统' },
  { key: 'components-demo:access', label: '组件演示', group: '其他' },
]

const mockRoles: MockRole[] = [
  {
    id: '1',
    name: 'admin',
    label: '超级管理员',
    description: '拥有系统所有权限，可管理所有用户和配置',
    permissions: ['*'],
    userCount: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-15T10:30:00Z',
  },
  {
    id: '4',
    name: 'user',
    label: '普通用户',
    description: '基本的系统使用权限',
    permissions: [
      'dashboard:access',
      'tasks:access',
      'chats:access',
      'settings:access',
      'help-center:access',
      'components-demo:access',
    ],
    userCount: 48,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-10-01T16:45:00Z',
  },
]

export const permissionsHandlers = [
  // 获取所有角色
  http.get('/api/roles', async () => {
    await sleep(300)
    return HttpResponse.json(mockRoles)
  }),

  // 获取单个角色
  http.get('/api/roles/:id', async ({ params }) => {
    await sleep(200)
    const role = mockRoles.find((r) => r.id === params.id)
    if (!role) {
      return HttpResponse.json(
        { code: 40401, msg: '角色不存在' },
        { status: 404 }
      )
    }
    return HttpResponse.json(role)
  }),

  // 创建角色
  http.post('/api/roles', async ({ request }) => {
    await sleep(300)
    const body = (await request.json()) as {
      name: string
      label: string
      description: string
      permissions: string[]
    }

    const newRole: MockRole = {
      id: faker.string.uuid(),
      name: body.name,
      label: body.label,
      description: body.description,
      permissions: body.permissions,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockRoles.push(newRole)
    return HttpResponse.json(newRole, { status: 201 })
  }),

  // 更新角色
  http.put('/api/roles/:id', async ({ params, request }) => {
    await sleep(300)
    const index = mockRoles.findIndex((r) => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json(
        { code: 40401, msg: '角色不存在' },
        { status: 404 }
      )
    }

    const body = (await request.json()) as {
      label?: string
      description?: string
      permissions?: string[]
    }

    mockRoles[index] = {
      ...mockRoles[index],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(mockRoles[index])
  }),

  // 删除角色
  http.delete('/api/roles/:id', async ({ params }) => {
    await sleep(200)
    const index = mockRoles.findIndex((r) => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json(
        { code: 40401, msg: '角色不存在' },
        { status: 404 }
      )
    }

    // 禁止删除 admin 角色
    if (mockRoles[index].name === 'admin') {
      return HttpResponse.json(
        { code: 40301, msg: '不能删除超级管理员角色' },
        { status: 403 }
      )
    }

    mockRoles.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // 获取所有可用权限列表
  http.get('/api/permissions/available', async () => {
    await sleep(100)
    return HttpResponse.json(AVAILABLE_PERMISSIONS)
  }),
]
