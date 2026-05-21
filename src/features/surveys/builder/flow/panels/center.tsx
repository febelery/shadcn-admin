import { useMemo } from 'react'
import { AlertCircle, AlertTriangle, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { useBuilderStore } from '../../store'
import { Canvas } from '../canvas'
import { useFlowContext } from '../context'
import { Toolbar } from '../toolbar'

/** 中栏：工具栏 + 流程图画布 */
export function CenterPanel() {
  const { analyseSurvey, getRuleCategory, flattenQuestions } = useFlowContext()
  const schema = useBuilderStore((s) => s.schema)
  const rules = useBuilderStore((s) => s.schema?.rules ?? [])

  const stats = useMemo(() => {
    if (!schema) return ''
    const qCount = flattenQuestions(schema).length
    const enabledRules = rules.filter((r) => r.enabled).length
    const byCat = {
      visibility: rules.filter((r) => getRuleCategory(r) === 'visibility')
        .length,
      jump: rules.filter((r) => getRuleCategory(r) === 'jump').length,
      end: rules.filter((r) => getRuleCategory(r) === 'end').length,
    }
    return `共 ${qCount} 题 · ${enabledRules} 条启用规则（显隐 ${byCat.visibility} · 跳题 ${byCat.jump} · 结束 ${byCat.end}）`
  }, [schema, rules, getRuleCategory, flattenQuestions])

  const issues = useMemo(
    () => (schema ? analyseSurvey(schema) : []),
    [schema, analyseSurvey]
  )
  const issueStats = useMemo(
    () => ({
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warn').length,
      first: issues[0],
    }),
    [issues]
  )

  return (
    <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
      <BuilderPanelHeader
        icon={Workflow}
        title='流程图'
        density='compact'
        action={
          stats ? (
            <span
              className={cn(
                'text-muted-foreground text-xs leading-snug',
                'hidden max-w-[280px] truncate md:inline'
              )}
            >
              {stats}
            </span>
          ) : null
        }
      />
      <Toolbar />
      {issueStats.first ? (
        <div
          className={cn(
            'border-border bg-background/95 flex min-h-9 shrink-0 items-center gap-2 border-b px-3',
            issueStats.errors > 0
              ? 'text-destructive'
              : 'text-amber-700 dark:text-amber-400'
          )}
        >
          {issueStats.errors > 0 ? (
            <AlertCircle className='size-4 shrink-0' />
          ) : (
            <AlertTriangle className='size-4 shrink-0' />
          )}
          <span className='shrink-0 text-xs leading-none font-medium'>
            {issueStats.errors > 0
              ? `${issueStats.errors} 个错误`
              : `${issueStats.warnings} 个提醒`}
          </span>
          <span className='text-muted-foreground min-w-0 truncate text-xs leading-none'>
            {issueStats.first.message}
          </span>
        </div>
      ) : null}
      <div className='relative min-h-0 flex-1 overflow-hidden pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'>
        <Canvas />
      </div>
    </div>
  )
}
