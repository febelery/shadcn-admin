import { Eye, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Rule } from '../../types'
import { useBuilderStatic, useBuilderStructure } from '../context'

type Props = {
  questionId: string
  className?: string
}

export function QuestionLogicBadges({ questionId, className }: Props) {
  const {
    schema,
    sectionId,
  } = useBuilderStructure()

  const {
    select,
    setEditingRuleId,
    setBuilderMode,
    getRulesForQuestion,
    ruleReferencesQuestionAsSource,
  } = useBuilderStatic()

  const rules = schema?.rules ?? []

  const hasVisibilityRules = (rulesList: Rule[], qId: string) => {
    return rulesList.some(
      (r) =>
        r.enabled &&
        r.actions.some(
          (a) => (a.type === 'show' || a.type === 'hide') && a.target === qId
        )
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
    if (sectionId) select(sectionId, questionId)
    const first = related[0]
    if (first) setEditingRuleId(first.id)
    setBuilderMode('flow')
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
