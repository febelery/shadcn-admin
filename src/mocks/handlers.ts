import { http, HttpResponse } from 'msw'
import { tasks } from '@/features/tasks/data/tasks'
import { users } from '@/features/users/data/users'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json(users)
  }),
  http.get('/api/tasks', () => {
    return HttpResponse.json(tasks)
  }),
  http.post('/api/login', async ({ request }) => {
    const data = await request.json() as { name: string; password: string }
    
    if (data.name === 'admin' && data.password === 'asdfasdf') {
      return HttpResponse.json({
        user: {
          name: 'Admin',
          email: 'admin@example.com',
          avatar: '/avatars/01.png',
          role: ['admin'],
        },
        accessToken: 'mock-access-token',
      })
    }

    return new HttpResponse(
      JSON.stringify({ message: '用户名或密码错误' }),
      { status: 400, statusText: 'Bad Request' }
    )
  }),
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 })
  }),
  http.get('/api/me', () => {
    return HttpResponse.json({
      name: 'Admin',
      email: 'admin@example.com',
      avatar: '/avatars/01.png',
      role: ['admin'],
    })
  }),
]
