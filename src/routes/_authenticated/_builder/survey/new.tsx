import { createFileRoute } from '@tanstack/react-router'
import { SurveyBuilderPage } from '@/features/survey/builder/survey-builder-page'

export const Route = createFileRoute('/_authenticated/_builder/survey/new')({
  component: () => <SurveyBuilderPage mode='create' />,
})
