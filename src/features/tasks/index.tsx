import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { getTasks } from './api'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'

const route = getRouteApi('/_authenticated/tasks/')

export function Tasks() {
  const search = route.useSearch()

  const queryParams = {
    page: search.page || 1,
    pageSize: search.pageSize || 10,
    sortBy: search.sortBy as string | undefined,
    sortOrder: search.sortOrder as 'asc' | 'desc' | undefined,
    search: search.filter as string | undefined,
    status: Array.isArray(search.status)
      ? search.status.join(',')
      : search.status || undefined,
    priority: Array.isArray(search.priority)
      ? search.priority.join(',')
      : search.priority || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => getTasks(queryParams),
  })

  return (
    <TasksProvider>
      <PageLayout
        headerFixed
        title='Tasks'
        description="Here's a list of your tasks for this month!"
        actions={<TasksPrimaryButtons />}
        mainClassName='flex flex-1 flex-col gap-4 sm:gap-6'
      >
        <TasksTable
          data={data?.data || []}
          total={data?.meta.total || 0}
          isLoading={isLoading}
        />
      </PageLayout>

      <TasksDialogs />
    </TasksProvider>
  )
}
