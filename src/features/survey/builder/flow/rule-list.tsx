import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { extractQuestionRefsFromWhen } from '@/features/survey/core/logic/condition-serializer'
import {
  getRuleCategory,
  RULE_CATEGORY_LABEL,
} from '@/features/survey/core/logic/rule-meta'
import { summarizeRuleAction } from '@/features/survey/core/logic/rule-utils'
import { useQuestionLabel } from '../edit/logic/use-survey-questions'
import { useBuilderStore } from '../store'
import type { StaticIssue, Rule } from '../types'
import { worstSeverity } from './issues/issue-utils'

function RuleRow({
  rule,
  selected,
  ruleIssues,
  onSelect,
}: {
  rule: Rule
  selected: boolean
  ruleIssues?: StaticIssue[]
  onSelect: () => void
}) {
  const removeRule = useBuilderStore((s) => s.removeRule)
  const category = getRuleCategory(rule)
  const action = rule.action
  const targetLabel = useQuestionLabel(action.target ?? '')
  const sourceId = extractQuestionRefsFromWhen(rule.when)[0]
  const sourceLabel = useQuestionLabel(sourceId ?? '')
  const severity = ruleIssues?.length ? worstSeverity(ruleIssues) : null
  const actionText = summarizeRuleAction(
    action,
    action.target ? targetLabel : undefined
  )
  const statusColor = severity
    ? severity === 'error'
      ? 'bg-destructive'
      : 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <div
      className={cn(
        'group bg-card flex min-w-0 items-stretch rounded-md border transition-colors',
        selected
          ? 'border-primary/50 bg-primary/7 shadow-xs'
          : 'hover:border-border hover:bg-muted/30 border-border/60',
        !rule.enabled && 'opacity-50'
      )}
    >
      <button
        type='button'
        className='min-w-0 flex-1 px-2.5 py-2.5 text-left'
        onClick={onSelect}
      >
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium',
                category === 'visibility' &&
                  'bg-sky-500/10 text-sky-700 dark:text-sky-400',
                category === 'jump' && 'bg-primary/10 text-primary',
                category === 'end' &&
                  'bg-blue-500/10 text-blue-700 dark:text-blue-400',
                category === 'other' && 'text-muted-foreground'
              )}
            >
              {RULE_CATEGORY_LABEL[category]}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[13px] leading-none font-medium'
              )}
              title={rule.name}
            >
              {rule.name}
            </span>
            {!rule.enabled ? (
              <span className='text-muted-foreground bg-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none'>
                停用
              </span>
            ) : null}
          </div>
          <div className='grid min-w-0 gap-1.5 text-[11px] leading-none'>
            <div className='grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1.5'>
              <span className='text-muted-foreground/70 font-medium'>IF</span>
              <span
                className='text-muted-foreground min-w-0 truncate'
                title={sourceLabel || '未设条件'}
              >
                {sourceLabel || '未设条件'}
              </span>
            </div>
            <div className='grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1.5'>
              <span className='text-muted-foreground/70 font-medium'>THEN</span>
              <span
                className='text-muted-foreground min-w-0 truncate'
                title={actionText}
              >
                {actionText}
              </span>
            </div>
          </div>
        </div>
      </button>
      <div className='flex w-9 shrink-0 flex-col items-center justify-between gap-2 px-1 py-2'>
        <span
          className={cn('size-1.5 rounded-full opacity-70', statusColor)}
          title={severity ? ruleIssues?.[0]?.message : '配置正确'}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-destructive size-7 shrink-0'
          onClick={() => removeRule(rule.id)}
          aria-label='删除规则'
        >
          <Trash2 className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}

type Props = {
  rules: Rule[]
  issuesByRule?: Map<string, StaticIssue[]>
}

export function RulesList({ rules, issuesByRule }: Props) {
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const selectFlowRule = useBuilderStore((s) => s.selectFlowRule)

  return (
    <div className='flex flex-col gap-2'>
      {rules.length === 0 ? (
        <p
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'py-6 text-center'
          )}
        >
          暂无规则
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {rules.map((r) => (
            <li key={r.id}>
              <RuleRow
                rule={r}
                selected={editingRuleId === r.id}
                ruleIssues={issuesByRule?.get(r.id)}
                onSelect={() => selectFlowRule(r.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
