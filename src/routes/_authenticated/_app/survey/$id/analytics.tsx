import { createFileRoute } from '@tanstack/react-router'
import { SurveyAnalyticsPage } from '@/features/survey/analytics/survey-analytics-page'

export const Route = createFileRoute(
  '/_authenticated/_app/survey/$id/analytics'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyAnalyticsPage surveyId={id} />
}
