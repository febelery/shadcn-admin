import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { sleep } from '@/lib/utils'

faker.seed(202511)

export const tasks = Array.from({ length: 100 }, () => {
  const statuses = [
    'todo',
    'in progress',
    'done',
    'canceled',
    'backlog',
  ] as const
  const labels = ['bug', 'feature', 'documentation'] as const
  const priorities = ['low', 'medium', 'high'] as const

  return {
    id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
    title: faker.lorem.sentence({ min: 5, max: 15 }),
    status: faker.helpers.arrayElement(statuses),
    label: faker.helpers.arrayElement(labels),
    priority: faker.helpers.arrayElement(priorities),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    assignee: faker.person.fullName(),
    description: faker.lorem.paragraph({ min: 1, max: 3 }),
    dueDate: faker.date.future(),
  }
})

export const tasksHandlers = [
  http.get('/api/tasks', async ({ request }) => {
    await sleep(200)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const priority = url.searchParams.get('priority') || ''
    const label = url.searchParams.get('label') || ''

    // Filter
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.id.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = !status || task.status === status
      const matchesPriority = !priority || task.priority === priority
      const matchesLabel = !label || task.label === label

      return matchesSearch && matchesStatus && matchesPriority && matchesLabel
    })

    // Sort
    filteredTasks.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Paginate
    const total = filteredTasks.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedTasks = filteredTasks.slice(start, end)

    return HttpResponse.json({
      data: paginatedTasks,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  }),
]
