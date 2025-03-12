import { createLazyFileRoute } from '@tanstack/react-router'
import UnauthorisedError from '@/pages/errors/401'

export const Route = createLazyFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})
