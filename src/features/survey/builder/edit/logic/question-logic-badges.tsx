import { Eye, GitBranch } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getQuestionRuleSummary } from '@/features/survey/core/logic/question-rule-index'
import { useBuilderStore } from '../../store'
import { useRuleAuthoring } from '../../store/use-rule-authoring'

type Props = {
  questionId: string
  className?: string
}

export function QuestionLogicBadges({ questionId, className }: Props) {
  const { firstRuleId, hasVisibility, hasBranch } = useBuilderStore(
    useShallow((s) => getQuestionRuleSummary(s.document.rules, questionId))
  )
  const { openRule } = useRuleAuthoring()

  if (!hasVisibility && !hasBranch) return null

  const openInFlow = () => {
    if (firstRuleId) openRule(firstRuleId)
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {hasVisibility ? (
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className={cn('h-6 gap-1 px-2', 'text-xs leading-none')}
          onClick={(e) => {
            e.stopPropagation()
            openInFlow()
          }}
        >
          <Eye className='size-3' />
          显隐
        </Button>
      ) : null}
      {hasBranch ? (
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className={cn('h-6 gap-1 px-2', 'text-xs leading-none')}
          onClick={(e) => {
            e.stopPropagation()
            openInFlow()
          }}
        >
          <GitBranch className='size-3' />
          分支
        </Button>
      ) : null}
    </div>
  )
}
