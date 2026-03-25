import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth-guard'
import { SurveyBuilder } from '@/features/survey-builder/survey-builder'

export const Route = createFileRoute('/survey/builder/$surveyId')({
  beforeLoad: requireAuth,
  component: SurveyBuilder,
})
