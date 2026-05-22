import { createFileRoute } from '@tanstack/react-router'
import { NotFoundError } from '@/features/error/not-found-error'

export const Route = createFileRoute('/(error)/404')({
  component: NotFoundError,
})
