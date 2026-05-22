import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { SurveyRecordPage } from '@/features/survey/record'

export const Route = createFileRoute('/_authenticated/_app/survey/$id/record')({
  beforeLoad: requirePermission('survey:access'),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveyRecordPage surveyId={id} />
}
