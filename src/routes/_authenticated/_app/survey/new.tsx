import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth-guard'
import { NewSurveySettingsPage } from '@/features/survey/settings'

export const Route = createFileRoute('/_authenticated/_app/survey/new')({
  beforeLoad: requirePermission('survey:access'),
  component: NewSurveySettingsPage,
})
