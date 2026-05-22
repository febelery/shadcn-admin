import { createFileRoute } from '@tanstack/react-router'
import { SettingNotification } from '@/features/setting/notification'

export const Route = createFileRoute(
  '/_authenticated/_app/setting/notification'
)({
  component: SettingNotification,
})
