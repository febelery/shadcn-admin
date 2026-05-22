import { createFileRoute } from '@tanstack/react-router'
import { SettingDisplay } from '@/features/setting/display'

export const Route = createFileRoute('/_authenticated/_app/setting/display')({
  component: SettingDisplay,
})
