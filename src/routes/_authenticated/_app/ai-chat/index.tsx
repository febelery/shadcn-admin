import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { AIChatPage } from '@/features/ai-chat'

export const Route = createFileRoute('/_authenticated/_app/ai-chat/')({
  beforeLoad: requirePermission('ai-chat:access'),
  component: AIChatPage,
})
