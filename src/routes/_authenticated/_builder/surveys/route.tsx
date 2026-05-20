import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'

/** 问卷编辑器路由分组：统一权限守卫 */
export const Route = createFileRoute('/_authenticated/_builder/surveys')({
  beforeLoad: requirePermission('surveys:access'),
  component: () => <Outlet />,
})
