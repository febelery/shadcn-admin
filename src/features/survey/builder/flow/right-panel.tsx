import { useMemo } from 'react'
import { MousePointerClick, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuilderGuidance } from '../edit/guidance'
import { BuilderPanelHeader } from '../shared/panel-header'
import { useBuilderStore } from '../store'
import { getRuleDraftIssues } from '../store/rule-authoring'
import type { FlowProjection } from './projection'
import { RuleEditorSection } from './rule-editor'

type Props = {
  projection: FlowProjection | null
  className?: string
}

/**
 * 流程模式 · 右栏
 *
 * 信息架构：
 * - 选中规则 → 规则
 * - 未选中规则 → 空态引导
 */
export function RightPanel({ projection, className }: Props) {
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const schema = useBuilderStore((s) => s.schema)
  const ruleDraft = useBuilderStore((s) => s.ruleDraft)

  const draftIssues = useMemo(
    () => (schema && ruleDraft ? getRuleDraftIssues(schema, ruleDraft) : []),
    [schema, ruleDraft]
  )
  const ruleIssues = ruleDraft
    ? draftIssues
    : editingRuleId
      ? (projection?.issuesByRule.get(editingRuleId) ?? [])
      : []

  let title = '规则'
  let content: React.ReactNode

  if (editingRuleId) {
    title = '规则'
    content = <RuleEditorSection ruleIssues={ruleIssues} />
  } else {
    content = (
      <div className='bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'>
        <BuilderGuidance
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-10 text-center',
            'px-6 py-12'
          )}
          icon={MousePointerClick}
          density='compact'
          title='未选中规则'
          description='从左侧规则列表选择规则，或点击流程图中的规则连线进行编辑。'
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <BuilderPanelHeader icon={Settings2} title={title} density='compact' />
      <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        {content}
      </div>
    </div>
  )
}
