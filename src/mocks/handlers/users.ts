import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'

faker.seed(1230)

export const users = Array.from({ length: 500 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    username: faker.internet
      .username({ firstName, lastName })
      .toLocaleLowerCase(),
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement([
      'active',
      'inactive',
      'invited',
      'suspended',
    ]),
    role: faker.helpers.arrayElement([
      'superadmin',
      'admin',
      'cashier',
      'manager',
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})

export const usersHandlers = [
  http.get('/api/users', async ({ request }) => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const role = url.searchParams.get('role') || ''

    // Filter
    const filteredUsers = users.filter((user) => {
      const matchesSearch =
        !search ||
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = !status || user.status === status
      const matchesRole = !role || user.role === role

      return matchesSearch && matchesStatus && matchesRole
    })

    // Sort
    filteredUsers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Paginate
    const total = filteredUsers.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedUsers = filteredUsers.slice(start, end)

    return HttpResponse.json({
      data: paginatedUsers,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  }),
]
