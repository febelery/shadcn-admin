import { createLazyFileRoute } from '@tanstack/react-router'
import NotFoundError from '@/pages/errors/404'

export const Route = createLazyFileRoute('/(errors)/404')({
  component: NotFoundError,
})
