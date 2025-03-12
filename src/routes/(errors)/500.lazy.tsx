import { createLazyFileRoute } from '@tanstack/react-router'
import GeneralError from '@/pages/errors/500'

export const Route = createLazyFileRoute('/(errors)/500')({
  component: GeneralError,
})
