import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { SurveySettingsPage } from '@/features/survey/settings'

export const Route = createFileRoute('/_authenticated/_app/survey/$id/edit')({
  beforeLoad: requirePermission('survey:access'),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <SurveySettingsPage surveyId={id} />
}
