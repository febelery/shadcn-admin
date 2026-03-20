import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/products'
import { requirePermission } from '@/lib/auth-guard'

export const Route = createFileRoute('/_authenticated/products/')({
  beforeLoad: requirePermission('products:access'),
  component: Products,
})
