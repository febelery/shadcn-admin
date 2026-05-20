import { useMemo, useCallback, useRef } from 'react'
import { Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { useBuilderStore } from '../../store'
import { Canvas } from '../canvas'
import { useFlowContext } from '../context'
import { Toolbar } from '../toolbar'

/** 中栏：工具栏 + 流程图画布 */
export function CenterPanel() {
  const { getRuleCategory, flattenQuestions } = useFlowContext()
  const schema = useBuilderStore((s) => s.schema)
  const rules = useBuilderStore((s) => s.schema?.rules ?? [])
  const fitViewRef = useRef<(() => void) | null>(null)

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

  const handleFitView = useCallback(() => {
    fitViewRef.current?.()
  }, [])

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
      <Toolbar onFitView={handleFitView} />
      <div className='relative min-h-0 flex-1 overflow-hidden pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'>
        <Canvas
          onRegisterFitView={(fn) => {
            fitViewRef.current = fn
          }}
        />
      </div>
    </div>
  )
}
