import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useQuestionLabel } from '../../edit/logic/use-survey-questions'
import { useBuilderStore } from '../../store'
import type { StaticIssue, Rule } from '../../types'
import { useFlowContext, RULE_CATEGORY_LABEL } from '../context'
import { worstSeverity } from '../issues/issue-utils'

function RuleStatusDot({ severity }: { severity: 'error' | 'warn' | null }) {
  if (!severity) {
    return (
      <span
        className='size-2 shrink-0 rounded-full bg-emerald-500/80'
        title='配置正确'
      />
    )
  }
  if (severity === 'error') {
    return (
      <span
        className='bg-destructive size-2 shrink-0 rounded-full'
        title='需要修复'
      />
    )
  }
  return (
    <span
      className='size-2 shrink-0 rounded-full bg-amber-500'
      title='有警告'
    />
  )
}

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
  const { getRuleCategory, summarizeRuleAction } = useFlowContext()
  const removeRule = useBuilderStore((s) => s.removeRule)
  const updateRule = useBuilderStore((s) => s.updateRule)
  const category = getRuleCategory(rule)
  const action = rule.actions[0]
  const targetLabel = useQuestionLabel(action?.target ?? '')
  const severity = ruleIssues?.length ? worstSeverity(ruleIssues) : null

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors',
        selected
          ? 'border-primary/50 bg-primary/5'
          : 'hover:border-border/60 hover:bg-muted/40 border-transparent',
        !rule.enabled && 'opacity-50'
      )}
    >
      <button
        type='button'
        className='flex min-w-0 flex-1 items-center gap-2 text-left'
        onClick={onSelect}
      >
        <RuleStatusDot severity={severity} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span
              className={cn(
                'text-xs leading-none',
                'shrink-0 rounded px-1 py-0.5',
                category === 'visibility' &&
                  'bg-sky-500/10 text-sky-700 dark:text-sky-400',
                category === 'jump' && 'bg-primary/10 text-primary',
                category === 'end' && 'bg-destructive/10 text-destructive',
                category === 'other' && 'text-muted-foreground'
              )}
            >
              {RULE_CATEGORY_LABEL[category]}
            </span>
            <span
              className={cn('text-xs leading-none', 'truncate font-medium')}
            >
              {rule.name}
            </span>
          </div>
          {action ? (
            <p
              className={cn(
                'text-muted-foreground text-xs leading-relaxed',
                'mt-0.5 line-clamp-2'
              )}
            >
              {summarizeRuleAction(
                action,
                action.target ? targetLabel : undefined
              )}
            </p>
          ) : (
            <p
              className={cn(
                'text-muted-foreground text-xs leading-relaxed',
                'text-muted-foreground mt-0.5'
              )}
            >
              未配置动作
            </p>
          )}
        </div>
      </button>
      <Switch
        checked={rule.enabled}
        onCheckedChange={(c) => updateRule(rule.id, { enabled: c })}
        aria-label='启用规则'
        className='shrink-0'
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='text-muted-foreground hover:text-destructive size-7 shrink-0 opacity-0 group-hover:opacity-100'
        onClick={() => removeRule(rule.id)}
        aria-label='删除规则'
      >
        <Trash2 className='size-3.5' />
      </Button>
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
    <div className='flex flex-col gap-0.5'>
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
        <ul className='flex flex-col gap-0.5'>
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
