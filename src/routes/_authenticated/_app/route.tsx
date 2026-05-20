import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

/** 后台主壳：侧栏 + 顶栏 */
export const Route = createFileRoute('/_authenticated/_app')({
  component: AuthenticatedLayout,
})
