import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/features/settings'
import { requirePermission } from '@/lib/auth-guard'

export const Route = createFileRoute('/_authenticated/settings')({
  beforeLoad: requirePermission('settings:access'),
  component: Settings,
})
