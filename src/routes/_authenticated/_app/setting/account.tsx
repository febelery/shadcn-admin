import { createFileRoute } from '@tanstack/react-router'
import { SettingAccount } from '@/features/setting/account'

export const Route = createFileRoute('/_authenticated/_app/setting/account')({
  component: SettingAccount,
})
