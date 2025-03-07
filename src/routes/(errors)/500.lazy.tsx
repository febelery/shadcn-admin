import { createLazyFileRoute } from '@tanstack/react-router'
import GeneralError from '@/pages/errors/general-error'

export const Route = createLazyFileRoute('/(errors)/500')({
  component: GeneralError,
})
