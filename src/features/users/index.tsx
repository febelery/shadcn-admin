import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/page-layout'
import { getUsers } from './api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
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
        <UsersTable data={users} search={search} navigate={navigate} />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
