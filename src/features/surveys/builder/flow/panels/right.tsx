import { useMemo } from 'react'
import { MousePointerClick, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BuilderGuidance } from '../../edit/guidance'
import { BuilderPanelHeader } from '../../shared/panel-header'
import { useBuilderStore } from '../../store'
import { useFlowContext } from '../context'
import { groupIssuesByRule, getQuestionIssues } from '../issues/issue-utils'
import { IssuesOverview } from '../issues/issues-overview'
import { QuestionActions } from '../issues/question-actions'
import { RuleEditorSection } from '../rules/rule-editor'
import { RuleValidation } from '../rules/rule-validation'

type Props = {
  className?: string
}

/**
 * 流程模式 · 右栏
 *
 * 信息架构：
 * - 选中规则 → Tabs 切换类型 / 校验 + 编辑器
 * - 选中题目 → 快捷逻辑
 * - 未选中且有问题 → 问题概览（入口）
 * - 否则 → 空态引导
 */
export function RightPanel({ className }: Props) {
  const { analyseSurvey } = useFlowContext()
  const schema = useBuilderStore((s) => s.schema)
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const rules = schema?.rules ?? []

  const issues = useMemo(
    () => (schema ? analyseSurvey(schema) : []),
    [schema, analyseSurvey]
  )

  const issuesByRule = useMemo(() => groupIssuesByRule(issues), [issues])

  const selectedIsQuestion =
    !!selectedElementId &&
    !!schema?.sections[0]?.elements.some(
      (e) => e.id === selectedElementId && e.kind === 'question'
    )

  const ruleIssues = editingRuleId
    ? (issuesByRule.get(editingRuleId) ?? [])
    : []
  const questionIssues =
    selectedIsQuestion && selectedElementId
      ? getQuestionIssues(issues).filter(
          (i) => i.targetId === selectedElementId
        )
      : []

  const hasOverview = !editingRuleId && !selectedIsQuestion && issues.length > 0

  let title = '属性'
  let content: React.ReactNode

  if (editingRuleId) {
    title = '编辑规则'
    content = <RuleEditorSection ruleIssues={ruleIssues} />
  } else if (selectedIsQuestion && selectedElementId) {
    title = '题目逻辑'
    content = (
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        {questionIssues.length > 0 ? (
          <RuleValidation issues={questionIssues} compact />
        ) : null}
        <QuestionActions questionId={selectedElementId} />
      </div>
    )
  } else if (hasOverview) {
    title = '逻辑检查'
    content = <IssuesOverview issues={issues} rules={rules} />
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
          title='选择规则或题目'
          description='左侧选规则 → 在此编辑并查看是否正确；点击流程图题目 → 添加快捷逻辑。'
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
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        {content}
      </div>
    </div>
  )
}
