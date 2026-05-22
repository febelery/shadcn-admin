import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { SettingPage } from '@/features/setting'

export const Route = createFileRoute('/_authenticated/_app/setting')({
  beforeLoad: requirePermission('setting:access'),
  component: SettingPage,
})
