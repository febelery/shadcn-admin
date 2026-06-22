import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { SurveyAnalysisPage } from '@/features/survey/analysis'

export const Route = createFileRoute(
  '/_authenticated/_app/survey/$id/analysis'
)({
  beforeLoad: requirePermission('survey:access'),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyAnalysisPage surveyId={id} />
}
