import { AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '../../store'
import type { StaticIssue, Rule } from '../../types'
import {
  groupIssuesByRule,
  getQuestionIssues,
  worstSeverity,
} from './issue-utils'

type Props = {
  issues: StaticIssue[]
  rules: Rule[]
}

/**
 * 未选中规则时的右栏概览 — 仅列出有问题的规则/题目，点击定位。
 */
export function IssuesOverview({ issues, rules }: Props) {
  const selectFlowRule = useBuilderStore((s) => s.selectFlowRule)
  const selectFlowQuestion = useBuilderStore((s) => s.selectFlowQuestion)

  const byRule = groupIssuesByRule(issues)
  const questionIssues = getQuestionIssues(issues)

  const rulesWithIssues = rules
    .filter((r) => byRule.has(r.id))
    .map((r) => ({ rule: r, issues: byRule.get(r.id)! }))

  if (rulesWithIssues.length === 0 && questionIssues.length === 0) {
    return null
  }

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div>
        <p className='text-xs leading-none'>逻辑检查</p>
        <p
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'mt-1'
          )}
        >
          选择下方条目查看详情并修复；规则问题请在右侧编辑。
        </p>
      </div>

      {rulesWithIssues.length > 0 ? (
        <section className='flex flex-col gap-1.5'>
          <p className='text-xs leading-none'>
            规则问题 ({rulesWithIssues.length})
          </p>
          <ul className='flex flex-col gap-1'>
            {rulesWithIssues.map(({ rule, issues: ruleIssues }) => {
              const sev = worstSeverity(ruleIssues)
              return (
                <li key={rule.id}>
                  <button
                    type='button'
                    className='hover:bg-muted/60 border-border/60 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors'
                    onClick={() => selectFlowRule(rule.id)}
                  >
                    {sev === 'error' ? (
                      <AlertCircle className='text-destructive size-3.5 shrink-0' />
                    ) : (
                      <AlertTriangle className='size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
                    )}
                    <div className='min-w-0 flex-1'>
                      <p
                        className={cn(
                          'text-sm leading-relaxed',
                          'truncate font-medium'
                        )}
                      >
                        {rule.name}
                      </p>
                      <p
                        className={cn(
                          'text-muted-foreground text-xs leading-relaxed',
                          'mt-0.5 line-clamp-1',
                          sev === 'error'
                            ? 'text-destructive'
                            : 'text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {ruleIssues[0]?.message}
                      </p>
                    </div>
                    <ChevronRight className='text-muted-foreground size-3.5 shrink-0' />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {questionIssues.length > 0 ? (
        <section className='flex flex-col gap-1.5'>
          <p className='text-xs leading-none'>
            题目问题 ({questionIssues.length})
          </p>
          <ul className='flex flex-col gap-1'>
            {questionIssues.map((i, idx) => (
              <li key={`${i.code}-${idx}`}>
                <button
                  type='button'
                  className='hover:bg-muted/60 border-border/60 flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors'
                  onClick={() => i.targetId && selectFlowQuestion(i.targetId)}
                >
                  <AlertTriangle className='mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
                  <span
                    className={cn(
                      'text-muted-foreground text-xs leading-relaxed',
                      'text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {i.message}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
