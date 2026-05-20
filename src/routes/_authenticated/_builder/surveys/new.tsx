import { createFileRoute } from '@tanstack/react-router'
import { SurveyBuilderPage } from '@/features/surveys/builder/survey-builder-page'

export const Route = createFileRoute('/_authenticated/_builder/surveys/new')({
  component: () => <SurveyBuilderPage mode='create' />,
})
