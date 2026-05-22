import { createFileRoute } from '@tanstack/react-router'
import { SurveyListPage } from '@/features/survey/list'

export const Route = createFileRoute('/_authenticated/_app/survey/')({
  component: SurveyListPage,
})
