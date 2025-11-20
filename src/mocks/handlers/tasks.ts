import { http, HttpResponse } from 'msw'
import { tasks } from '@/features/tasks/data/tasks'

export const tasksHandlers = [
  http.get('/api/tasks', () => {
    return HttpResponse.json(tasks)
  }),
]
