import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getTasks } from './api'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { priorities, statuses } from './data/data'

export function Tasks() {
  // 定义筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      columnId: 'status',
      title: 'Status',
      options: statuses,
    },
    {
      columnId: 'priority',
      title: 'Priority',
      options: priorities,
    },
  ]

  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    sorting: { enabled: true },
    filters: filterConfigs,
  })

  const { data, isFetching } = useQuery({
    queryKey: ['tasks', tableState.getQueryParams()],
    queryFn: () => getTasks(tableState.getQueryParams()),
  })

  return (
    <TasksProvider>
      <PageLayout
        title='Tasks'
        description="Here's a list of your tasks for this month!"
        actions={<TasksPrimaryButtons />}
        mainClassName='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <TasksTable
          data={data?.data || []}
          total={data?.meta?.total || 0}
          isLoading={isFetching}
          tableState={tableState}
        />
      </PageLayout>

      <TasksDialogs />
    </TasksProvider>
  )
}
