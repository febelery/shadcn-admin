import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth-guard'

/** 登录守卫层：仅鉴权，不挂载 UI 壳 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: requireAuth,
  component: () => <Outlet />,
})
