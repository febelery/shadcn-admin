import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getUserList } from './api'
import { UserDialogs } from './components/user-dialogs'
import { UserPrimaryButtons } from './components/user-primary-buttons'
import { UserProvider } from './components/user-provider'
import { UserTable } from './components/user-table'
import { roles } from './data/data'

export function UserPage() {
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

  const { data, isFetching } = useQuery({
    queryKey: ['user', tableState.getQueryParams()],
    queryFn: () => getUserList(tableState.getQueryParams()),
  })

  return (
    <UserProvider>
      <PageLayout
        title='User List'
        description='Manage your users and their roles here.'
        actions={<UserPrimaryButtons />}
        className='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <UserTable
          data={data?.data || []}
          total={data?.meta?.total || 0}
          isLoading={isFetching}
          tableState={tableState}
        />
      </PageLayout>

      <UserDialogs />
    </UserProvider>
  )
}
