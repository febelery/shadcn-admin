import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { PageLayout } from '@/components/layout/page-layout'
import { getTasks } from './api'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'

export function Tasks() {
  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    sorting: { enabled: true },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'priority', searchKey: 'priority', type: 'array' },
    ],
  })

  // 使用 getApiParams 生成 API 查询参数（使用 useMemo 优化性能）
  const queryParams = useMemo(() => {
    const apiParams = tableState.getApiParams()
    return {
      page: (apiParams.page as number) || 1,
      pageSize: (apiParams.pageSize as number) || 10,
      sortBy: apiParams.sortBy as string | undefined,
      sortOrder: apiParams.sortOrder as 'asc' | 'desc' | undefined,
      search: apiParams.filter as string | undefined,
      status: Array.isArray(apiParams.status)
        ? apiParams.status.join(',')
        : (apiParams.status as string) || undefined,
      priority: Array.isArray(apiParams.priority)
        ? apiParams.priority.join(',')
        : (apiParams.priority as string) || undefined,
    }
  }, [tableState])

  const { data, isFetching } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => getTasks(queryParams),
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
