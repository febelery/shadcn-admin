import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/coming-soon'
import { requirePermission } from '@/lib/auth-guard'

export const Route = createFileRoute('/_authenticated/_app/help-center/')({
  beforeLoad: requirePermission('help-center:access'),
  component: ComingSoon,
})
