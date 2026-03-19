import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/products'
import { requirePermission } from '@/routes/_authenticated/route'

export const Route = createFileRoute('/_authenticated/products/')({
  beforeLoad: requirePermission('products:access'),
  component: Products,
})
