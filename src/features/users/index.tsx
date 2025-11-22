import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { PageLayout } from '@/components/layout/page-layout'
import { getUsers } from './api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

export function Users() {
  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    sorting: { enabled: true },
    columnFilters: [
      { columnId: 'username', searchKey: 'username', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'role', searchKey: 'role', type: 'array' },
    ],
  })

  // 使用 getApiParams 生成 API 查询参数
  const apiParams = tableState.getApiParams()

  const queryParams = {
    page: (apiParams.page as number) || 1,
    pageSize: (apiParams.pageSize as number) || 10,
    sortBy: apiParams.sortBy as string | undefined,
    sortOrder: apiParams.sortOrder as 'asc' | 'desc' | undefined,
    search: apiParams.username as string | undefined,
    status: Array.isArray(apiParams.status)
      ? apiParams.status.join(',')
      : (apiParams.status as string) || undefined,
    role: Array.isArray(apiParams.role)
      ? apiParams.role.join(',')
      : (apiParams.role as string) || undefined,
  }

  const { data, isFetching } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => getUsers(queryParams),
  })

  return (
    <UsersProvider>
      <PageLayout
        title='User List'
        description='Manage your users and their roles here.'
        actions={<UsersPrimaryButtons />}
        mainClassName='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <UsersTable
          data={data?.data || []}
          total={data?.meta?.total || 0}
          isLoading={isFetching}
          tableState={tableState}
        />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
