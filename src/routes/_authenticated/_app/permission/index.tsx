import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { PermissionPage } from '@/features/permission'

export const Route = createFileRoute('/_authenticated/_app/permission/')({
  beforeLoad: requirePermission('permission:access'),
  component: PermissionPage,
})
