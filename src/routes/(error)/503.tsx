import { createFileRoute } from '@tanstack/react-router'
import { MaintenanceError } from '@/features/error/maintenance-error'

export const Route = createFileRoute('/(error)/503')({
  component: MaintenanceError,
})
