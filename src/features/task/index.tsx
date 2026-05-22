import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getTaskList } from './api'
import { TaskDialogs } from './components/task-dialogs'
import { TaskPrimaryButtons } from './components/task-primary-buttons'
import { TaskProvider } from './components/task-provider'
import { TaskTable } from './components/task-table'
import { priorities, statuses } from './data/data'

export function TaskPage() {
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
    queryKey: ['task', tableState.getQueryParams()],
    queryFn: () => getTaskList(tableState.getQueryParams()),
  })

  return (
    <TaskProvider>
      <PageLayout
        title='Tasks'
        description="Here's a list of your tasks for this month!"
        actions={<TaskPrimaryButtons />}
        className='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <TaskTable
          data={data?.data || []}
          total={data?.meta?.total || 0}
          isLoading={isFetching}
          tableState={tableState}
        />
      </PageLayout>

      <TaskDialogs />
    </TaskProvider>
  )
}
