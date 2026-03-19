import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '@/constants'
import { useAuthStore, getToken } from '@/stores/auth-store'
import { hasPermission } from '@/lib/permissions'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

function redirectToSignIn(from: string): never {
  throw redirect({
    to: ROUTES.SIGN_IN,
    search: { redirect: from },
  })
}

async function requireAuth({ location }: { location: { href: string } }) {
  const { auth } = useAuthStore.getState()

  if (!getToken()) {
    auth.reset()
    redirectToSignIn(location.href)
  }

  if (!auth.user) {
    try {
      await auth.fetchUser()
    } catch {
      redirectToSignIn(location.href)
    }
  }
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
})

/**
 * 创建路由级权限守卫
 *
 * 在子路由的 beforeLoad 中调用此函数，检查当前用户是否具备对应模块的 access 权限。
 * 无权限时跳转 403 页面。
 *
 * @param permission - 需要的权限字符串，如 "users:access"
 *
 * @example
 * ```ts
 * export const Route = createFileRoute('/_authenticated/users/')({
 *   beforeLoad: requirePermission('users:access'),
 *   component: Users,
 * })
 * ```
 */
export function requirePermission(permission: string) {
  return () => {
    const { auth } = useAuthStore.getState()
    const permissions = auth.user?.permissions ?? []

    if (!hasPermission(permissions, permission)) {
      throw redirect({ to: ROUTES.FORBIDDEN })
    }
  }
}
