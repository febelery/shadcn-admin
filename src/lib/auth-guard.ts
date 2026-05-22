import { redirect } from '@tanstack/react-router'
import { ROUTES } from '@/constants'
import { useAuthStore, getToken } from '@/stores/auth-store'
import { hasPermission } from '@/lib/permission'

function redirectToSignIn(from: string): never {
  throw redirect({
    to: ROUTES.SIGN_IN,
    search: { redirect: from },
  })
}

/**
 * 核心鉴权卫士 — 可用于任何需要登录的路由 beforeLoad
 */
export async function requireAuth({
  location,
}: {
  location: { href: string }
}) {
  const { auth } = useAuthStore.getState()

  // 1. 检查本地 Token
  if (!getToken()) {
    auth.reset()
    redirectToSignIn(location.href)
  }

  // 2. 检查内存用户信息，缺失则拉取
  if (!auth.user) {
    try {
      await auth.fetchUser()
    } catch {
      redirectToSignIn(location.href)
    }
  }
}

/**
 * 权限检查卫士
 * @param permission - 所需权限
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
