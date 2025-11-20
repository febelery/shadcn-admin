import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const authStore = useAuthStore.getState()
    const { isLogged } = { isLogged: !!authStore.auth.accessToken }

    if (!isLogged) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }

    // 如果已登录但没有用户信息，尝试获取
    if (!authStore.auth.user) {
      await authStore.auth.fetchUser()
    }
  },
  component: AuthenticatedLayout,
})
