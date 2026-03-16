import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import { type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getUsers } from './api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { roles } from './data/data'

function UsersInner() {
  // 定义筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      columnId: 'username',
      title: 'Username',
    },
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
      allowedOperators: ['is', 'isNot'],
    },
    {
      columnId: 'role',
      title: 'Role',
      options: roles.map((role) => ({ ...role })),
      allowedOperators: ['is', 'isNot'],
    },
  ]

  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    sorting: { enabled: true },
    filters: filterConfigs,
  })

  const { data, isFetching } = useSuspenseQuery({
    queryKey: ['users', tableState.getQueryParams()],
    queryFn: () => getUsers(tableState.getQueryParams()),
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

export function Users() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className='space-y-4 p-6'>
            <Skeleton className='h-8 w-48' />
            <div className='space-y-3 rounded-md border p-4'>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          </div>
        }
      >
        <UsersInner />
      </Suspense>
    </ErrorBoundary>
  )
}
