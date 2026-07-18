import { Eye, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  getRulesForQuestion,
  ruleReferencesQuestionAsSource,
} from '@/features/survey/core/logic/rule-utils'
import { useBuilderStore } from '../../store'
import { useRuleAuthoring } from '../../store/use-rule-authoring'
import type { Rule } from '../../types'

type Props = {
  questionId: string
  className?: string
}

export function QuestionLogicBadges({ questionId, className }: Props) {
  const schema = useBuilderStore((s) => s.schema)
  const { openRule } = useRuleAuthoring()

  const rules = schema?.rules ?? []

  const hasVisibilityRules = (rulesList: Rule[], qId: string) => {
    return rulesList.some(
      (r) =>
        r.enabled &&
        (r.action.type === 'show' || r.action.type === 'hide') &&
        r.action.target === qId
    )
  }

  const hasBranchRules = (rulesList: Rule[], qId: string) => {
    return rulesList.some(
      (r) => r.enabled && ruleReferencesQuestionAsSource(r, qId)
    )
  }

  const vis = hasVisibilityRules(rules, questionId)
  const branch = hasBranchRules(rules, questionId)
  const related = getRulesForQuestion(rules, questionId)

  if (!vis && !branch) return null

  const openInFlow = () => {
    const first = related[0]
    if (first) openRule(first.id)
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {vis ? (
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
      {branch ? (
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
