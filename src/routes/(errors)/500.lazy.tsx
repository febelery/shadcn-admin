import { createLazyFileRoute } from '@tanstack/react-router'
import GeneralError from '@/pages/errors/internal-server-error'

export const Route = createLazyFileRoute('/(errors)/500')({
  component: GeneralError,
})
