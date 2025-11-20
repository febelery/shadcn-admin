import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/page-layout'
import { getTasks } from './api'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'

export function Tasks() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
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
        <TasksTable data={tasks} />
      </PageLayout>

      <TasksDialogs />
    </TasksProvider>
  )
}
