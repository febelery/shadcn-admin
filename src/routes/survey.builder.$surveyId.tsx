import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth-guard'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SurveyBuilder } from '@/features/survey-builder/components/survey-builder'

// 独立路由
export const Route = createFileRoute('/survey/builder/$surveyId')({
  beforeLoad: requireAuth,
  component: BuilderRoute,
})

function BuilderRoute() {
  return (
    <TooltipProvider>
      <SurveyBuilder />
    </TooltipProvider>
  )
}
