import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_app/setting/')({
  beforeLoad: () => {
    throw redirect({ to: '/setting/profile' })
  },
})
