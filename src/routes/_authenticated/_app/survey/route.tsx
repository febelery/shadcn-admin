import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'

/** 问卷模块路由分组：统一权限守卫 */
export const Route = createFileRoute('/_authenticated/_app/survey')({
  beforeLoad: requirePermission('survey:access'),
  component: () => <Outlet />,
})
