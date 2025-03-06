import { createLazyFileRoute } from '@tanstack/react-router'
import UnauthorisedError from '@/pages/errors/unauthorized-error'

export const Route = createLazyFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})
