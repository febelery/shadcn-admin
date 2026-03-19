import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/coming-soon'
import { requirePermission } from '@/routes/_authenticated/route'

export const Route = createFileRoute('/_authenticated/help-center/')({
  beforeLoad: requirePermission('help-center:access'),
  component: ComingSoon,
})
