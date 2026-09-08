import { createFileRoute } from '@tanstack/react-router'
import { SettingProfile } from '@/features/setting/profile'

export const Route = createFileRoute('/_authenticated/_app/setting/profile')({
  component: SettingProfile,
})
