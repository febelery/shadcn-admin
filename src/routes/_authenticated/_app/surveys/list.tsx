import { createFileRoute } from '@tanstack/react-router'
import { SurveyListPage } from '@/features/surveys/list'

export const Route = createFileRoute('/_authenticated/_app/surveys/list')({
  component: SurveyListPage,
})
