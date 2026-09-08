import { createFileRoute } from '@tanstack/react-router'
import { SurveyBuilderPage } from '@/features/survey/builder/survey-builder-page'

export const Route = createFileRoute(
  '/_authenticated/_builder/survey/$id/edit'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyBuilderPage mode='edit' surveyId={id} />
}
