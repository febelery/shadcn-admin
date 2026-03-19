import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/features/settings'
import { requirePermission } from '@/routes/_authenticated/route'

export const Route = createFileRoute('/_authenticated/settings')({
  beforeLoad: requirePermission('settings:access'),
  component: Settings,
})
