import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '@/features/chats'
import { requirePermission } from '@/routes/_authenticated/route'

export const Route = createFileRoute('/_authenticated/chats/')({
  beforeLoad: requirePermission('chats:access'),
  component: Chats,
})
