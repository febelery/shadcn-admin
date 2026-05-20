import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '@/features/chats'
import { requirePermission } from '@/lib/auth-guard'

export const Route = createFileRoute('/_authenticated/_app/chats/')({
  beforeLoad: requirePermission('chats:access'),
  component: Chats,
})
