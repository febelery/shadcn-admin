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
]
