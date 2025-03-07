import { createFileRoute, redirect, lazyRouteComponent } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: async () => {
    if (useAuthStore.getState().getToken()) {
      throw redirect({
        to: useAuthStore.getState().getRedirectAfterLogin(),
        replace: true,
      })
    }
  },
  component: lazyRouteComponent(() => import('@/pages/auth/login')),
})
