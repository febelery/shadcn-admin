import { http, HttpResponse } from 'msw'

/**
 * Mock 用户数据
 *
 * - admin: 超管，permissions = ["*"]
 * - user:  普通用户，仅有部分模块的 access 权限
 */

export const MOCK_USERS = {
  admin: {
    user: {
      name: 'Admin',
      email: 'admin@example.com',
      avatar: '/avatars/01.png',
      role: ['admin'],
      permissions: ['*'],
    },
    accessToken: 'mock-access-token-admin',
  },
  user: {
    user: {
      name: 'User',
      email: 'user@example.com',
      avatar: '/avatars/02.png',
      role: ['user'],
      permissions: [
        'tasks:access',
        'chats:access',
        'settings:access',
        'help-center:access',
        'surveys:access',
      ],
    },
    accessToken: 'mock-access-token-user',
  },
} as const

export function getUserByToken(token: string) {
  const userKey = Object.keys(MOCK_USERS).find(
    (key) => MOCK_USERS[key as keyof typeof MOCK_USERS].accessToken === token
  )
  return userKey ? MOCK_USERS[userKey as keyof typeof MOCK_USERS] : null
}

export const authHandlers = [
  http.post('/api/login', async ({ request }) => {
    const data = (await request.json()) as { name: string; password: string }

    if (data.name === 'admin' && data.password === 'asdfasdf') {
      return HttpResponse.json(MOCK_USERS.admin)
    }

    if (data.name === 'user' && data.password === 'asdfasdf') {
      return HttpResponse.json(MOCK_USERS.user)
    }

    return HttpResponse.json(
      { code: 40001, msg: '用户名或密码错误' },
      { status: 400 }
    )
  }),
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 })
  }),
  http.get('/api/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 401, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const user = getUserByToken(token)

    if (!user) {
      return HttpResponse.json(
        { code: 401, msg: 'Invalid token' },
        { status: 401 }
      )
    }

    return HttpResponse.json(user.user)
  }),
]
