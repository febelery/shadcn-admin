import { MousePointerClick, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QuestionElement, RuleActionType } from '../../types'
import { useBuilderStatic, useBuilderStructure, useBuilderActiveState } from '../context'
import { BuilderGuidance } from '../guidance'
import { ActionBuilder } from './action-builder'
import { ConditionBuilder } from './condition-builder'
import { useSurveyQuestions } from './use-survey-questions'

function priorQuestionIds(
  questions: QuestionElement[],
  targetId?: string
): string[] {
  if (!targetId || !questions.length) return questions.map((q) => q.id)
  const tgtIdx = questions.findIndex((q) => q.id === targetId)
  if (tgtIdx <= 0)
    return questions.slice(0, Math.max(0, tgtIdx)).map((q) => q.id)
  return questions.slice(0, tgtIdx).map((q) => q.id)
}

type Props = {
  className?: string
  /** 内嵌在流程右栏时由外层提供标题栏 */
  hideHeader?: boolean
  onClose?: () => void
  /** 限制动作类型（流程右栏类型 Tab） */
  allowedActionTypes?: RuleActionType[]
  /** 流程右栏内嵌时隐藏底部说明 */
  hideFooterNote?: boolean
}

export function RuleEditorPanel({
  className,
  hideHeader,
  onClose,
  allowedActionTypes,
  hideFooterNote,
}: Props) {
  const { editingRuleId } = useBuilderActiveState()
  const { schema } = useBuilderStructure()
  const {
    setEditingRuleId,
    updateRule,
    extractQuestionRefsFromWhen,
    createRuleAction,
  } = useBuilderStatic()

  const questions = useSurveyQuestions()

  const rule = schema?.rules.find((r) => r.id === editingRuleId)
  const action = rule?.actions[0] ?? createRuleAction('show')
  const allowedSourceIds = priorQuestionIds(questions, action.target)
  const defaultSourceId = allowedSourceIds[allowedSourceIds.length - 1]

  const handleClose = () => {
    setEditingRuleId(null)
    onClose?.()
  }

  if (!rule) {
    return (
      <div
        className={cn(
          'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col',
          className
        )}
      >
        <BuilderGuidance
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-10 text-center',
            'px-6 py-12'
          )}
          icon={MousePointerClick}
          density='compact'
          title='未选中规则'
          description='从左侧列表选择规则，或点击流程图中的彩色连线进行编辑。'
        />
      </div>
    )
  }

  const sourceFromWhen = extractQuestionRefsFromWhen(rule.when)[0]
  const sourceId = sourceFromWhen ?? defaultSourceId
  const sourceIdx = questions.findIndex((q) => q.id === sourceId)

  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col',
        'min-h-0',
        className
      )}
    >
      {!hideHeader ? (
        <div className='border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3'>
          <p className='text-sm leading-none font-semibold tracking-tight'>
            编辑规则
          </p>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-8 shrink-0'
            onClick={handleClose}
            aria-label='关闭规则编辑'
          >
            <X className='size-4' />
          </Button>
        </div>
      ) : null}
      <ScrollArea className='min-h-0 flex-1'>
        <div className={cn('flex flex-col gap-3', 'p-4')}>
          <div className='flex flex-col gap-1.5'>
            <Label className='text-xs'>规则名称</Label>
            <Input
              className='h-9'
              value={rule.name}
              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
            />
          </div>

          <ConditionBuilder
            when={rule.when}
            onWhenChange={(when) => updateRule(rule.id, { when })}
            allowedSourceIds={allowedSourceIds}
            defaultSourceId={sourceFromWhen ?? defaultSourceId}
          />

          <ActionBuilder
            action={action}
            onChange={(next) => updateRule(rule.id, { actions: [next] })}
            targetQuestionIds={
              action.type === 'jump_to_question'
                ? questions.slice(sourceIdx + 1).map((q) => q.id)
                : questions.map((q) => q.id)
            }
            allowedTypes={allowedActionTypes}
          />

          {!hideFooterNote ? (
            <p className='text-muted-foreground text-xs leading-relaxed'>
              修改会即时写入问卷 schema，保存问卷后持久化。
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
