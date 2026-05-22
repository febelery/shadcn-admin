import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { ForbiddenError } from '@/features/error/forbidden'
import { GeneralError } from '@/features/error/general-error'
import { MaintenanceError } from '@/features/error/maintenance-error'
import { NotFoundError } from '@/features/error/not-found-error'
import { UnauthorisedError } from '@/features/error/unauthorized-error'

export const Route = createFileRoute('/_authenticated/_app/error/$error')({
  component: RouteComponent,
})

function RouteComponent() {
  const { error } = Route.useParams()

  const errorMap: Record<string, React.ComponentType> = {
    unauthorized: UnauthorisedError,
    forbidden: ForbiddenError,
    'not-found': NotFoundError,
    'internal-server-error': GeneralError,
    'maintenance-error': MaintenanceError,
  }
  const ErrorComponent = errorMap[error] || NotFoundError

  return (
    <PageLayout className='flex-1 [&>div]:h-full'>
      <ErrorComponent />
    </PageLayout>
  )
}
