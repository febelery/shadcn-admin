import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { SurveyRecordsPage } from '@/features/surveys/records'

export const Route = createFileRoute(
  '/_authenticated/_app/surveys/$id/records'
)({
  beforeLoad: requirePermission('surveys:access'),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyRecordsPage surveyId={id} />
}
