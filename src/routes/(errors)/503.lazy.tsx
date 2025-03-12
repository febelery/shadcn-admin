import { createLazyFileRoute } from '@tanstack/react-router'
import MaintenanceError from '@/pages/errors/503'

export const Route = createLazyFileRoute('/(errors)/503')({
  component: MaintenanceError,
})
