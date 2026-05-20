import { createFileRoute } from '@tanstack/react-router'
import { SurveyBuilderPage } from '@/features/surveys/builder/survey-builder-page'

export const Route = createFileRoute('/_authenticated/_builder/surveys/$id/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyBuilderPage mode='edit' surveyId={id} />
}
