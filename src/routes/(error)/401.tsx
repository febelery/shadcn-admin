import { createFileRoute } from '@tanstack/react-router'
import { UnauthorisedError } from '@/features/error/unauthorized-error'

export const Route = createFileRoute('/(error)/401')({
  component: UnauthorisedError,
})
