import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { ProductPage } from '@/features/product'

export const Route = createFileRoute('/_authenticated/_app/product/')({
  beforeLoad: requirePermission('product:access'),
  component: ProductPage,
})
