import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { ChatPage } from '@/features/chat'

export const Route = createFileRoute('/_authenticated/_app/chat/')({
  beforeLoad: requirePermission('chat:access'),
  component: ChatPage,
})
