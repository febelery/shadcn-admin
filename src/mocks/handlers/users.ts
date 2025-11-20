import { http, HttpResponse } from 'msw'
import { users } from '@/features/users/data/users'

export const usersHandlers = [
  http.get('/api/users', () => {
    return HttpResponse.json(users)
  }),
]
