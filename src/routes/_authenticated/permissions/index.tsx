import { createFileRoute } from '@tanstack/react-router'
import { Permissions } from '@/features/permissions'
import { requirePermission } from '@/routes/_authenticated/route'

export const Route = createFileRoute('/_authenticated/permissions/')({
  beforeLoad: requirePermission('permissions:access'),
  component: Permissions,
})
