import { createLazyFileRoute } from '@tanstack/react-router'
import ForbiddenError from '@/pages/errors/forbidden'

export const Route = createLazyFileRoute('/(errors)/403')({
  component: ForbiddenError,
})
