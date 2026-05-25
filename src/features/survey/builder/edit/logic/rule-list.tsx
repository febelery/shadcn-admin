import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  summarizeRuleAction,
  getRulesForQuestion,
} from '@/features/survey/core/logic/rule-utils'
import { useBuilderStore } from '../../store'
import type { Rule } from '../../types'
import { useQuestionLabel } from './use-survey-questions'

function RuleActionSummary({ action }: { action: Rule['action'] }) {
  const label = useQuestionLabel(action.target ?? '')
  return <>{summarizeRuleAction(action, action.target ? label : undefined)}</>
}

function RuleCard({ rule, onEdit }: { rule: Rule; onEdit: () => void }) {
  const removeRule = useBuilderStore((s) => s.removeRule)

  return (
    <div
      className={cn(
        'border-border/60 flex flex-col gap-2 rounded-lg border p-3',
        !rule.enabled && 'opacity-60'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <button
          type='button'
          className='min-w-0 flex-1 text-left'
          onClick={onEdit}
        >
          <p className={cn('text-sm leading-relaxed', 'font-medium')}>
            {rule.name}
          </p>
          <p
            className={cn(
              'text-muted-foreground text-xs leading-relaxed',
              'mt-0.5 truncate font-mono'
            )}
          >
            {rule.when || '（无条件）'}
          </p>
        </button>
      </div>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        → <RuleActionSummary action={rule.action} />
      </p>
      <div className='flex gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={onEdit}>
          编辑
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='text-destructive'
          onClick={() => removeRule(rule.id)}
        >
          <Trash2 className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}

type Props = {
  questionId?: string
  onEditRule: (ruleId: string) => void
}

export function RuleList({ questionId, onEditRule }: Props) {
  const schema = useBuilderStore((s) => s.schema)
  const addRule = useBuilderStore((s) => s.addRule)
  const rules = schema?.rules ?? []

  const filtered = questionId ? getRulesForQuestion(rules, questionId) : rules

  return (
    <div className='flex flex-col gap-3'>
      {filtered.length === 0 ? (
        <p
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'text-muted-foreground'
          )}
        >
          {questionId ? '本题暂无相关逻辑规则' : '全卷暂无逻辑规则'}
        </p>
      ) : (
        filtered.map((r: Rule) => (
          <RuleCard key={r.id} rule={r} onEdit={() => onEditRule(r.id)} />
        ))
      )}
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-full'
        onClick={() => {
          const id = addRule()
          onEditRule(id)
        }}
      >
        <Plus className='mr-1.5 size-3.5' />
        添加规则
      </Button>
    </div>
  )
}
