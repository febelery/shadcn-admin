import { createFileRoute } from '@tanstack/react-router'
import { SettingAppearance } from '@/features/setting/appearance'

export const Route = createFileRoute('/_authenticated/_app/setting/appearance')(
  {
    component: SettingAppearance,
  }
)
