import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTableState } from '@/hooks/use-table-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import { type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { getTasks } from './api'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { priorities, statuses } from './data/data'

function TasksInner() {
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

  const { data, isFetching } = useSuspenseQuery({
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

export function Tasks() {
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
        <TasksInner />
      </Suspense>
    </ErrorBoundary>
  )
}
