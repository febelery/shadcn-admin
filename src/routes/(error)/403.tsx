import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from '@/features/error/forbidden'

export const Route = createFileRoute('/(error)/403')({
  component: ForbiddenError,
})
