import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { getUsers } from './api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate() as any

  const queryParams = {
    page: search.page || 1,
    pageSize: search.pageSize || 10,
    sortBy: search.sortBy as string | undefined,
    sortOrder: search.sortOrder as 'asc' | 'desc' | undefined,
    search: search.username as string | undefined,
    status: Array.isArray(search.status)
      ? search.status.join(',')
      : search.status || undefined,
    role: Array.isArray(search.role)
      ? search.role.join(',')
      : search.role || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => getUsers(queryParams),
  })

  return (
    <UsersProvider>
      <PageLayout
        headerFixed
        title='User List'
        description='Manage your users and their roles here.'
        actions={<UsersPrimaryButtons />}
        mainClassName='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <UsersTable
          data={data?.data || []}
          total={data?.meta.total || 0}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
        />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
