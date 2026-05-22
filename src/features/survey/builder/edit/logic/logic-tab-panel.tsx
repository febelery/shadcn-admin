import { Button } from '@/components/ui/button'
import { canUseQuestionAsRuleSource } from '../../../core/logic/rule-capabilities'
import { useBuilderStatic } from '../../context'
import { BuilderGuidance } from '../guidance'
import { RuleList } from './rule-list'
import { useSurveyQuestions } from './use-survey-questions'

type Props = {
  selectedQuestionId?: string
  onEditRule: (ruleId: string) => void
}

export function LogicTabPanel({ selectedQuestionId, onEditRule }: Props) {
  const { addVisibilityRule, addNavigationRule, serializeCondition } =
    useBuilderStatic()
  const questions = useSurveyQuestions()

  const selectedQ = selectedQuestionId
    ? questions.find((q) => q.id === selectedQuestionId)
    : undefined

  const priorSourceIds = selectedQuestionId
    ? questions
        .slice(
          0,
          questions.findIndex((q) => q.id === selectedQuestionId)
        )
        .filter(canUseQuestionAsRuleSource)
        .map((q) => q.id)
    : []

  const handleQuickShow = () => {
    if (!selectedQuestionId || priorSourceIds.length === 0) return
    const src = priorSourceIds[priorSourceIds.length - 1]
    const srcQ = questions.find((q) => q.id === src)
    const when = serializeCondition({
      source: 'q',
      ref: src,
      operator: 'not_empty',
    })
    const id = addVisibilityRule({
      targetQuestionId: selectedQuestionId,
      when,
      action: 'show',
      name: `显示 · ${srcQ?.title?.slice(0, 12) ?? '条件'}`,
    })
    onEditRule(id)
  }

  const handleQuickEnd = () => {
    if (!selectedQuestionId) return
    if (!selectedQ || !canUseQuestionAsRuleSource(selectedQ)) return
    const when = serializeCondition({
      source: 'q',
      ref: selectedQuestionId,
      operator: 'not_empty',
    })
    const id = addNavigationRule({
      when,
      action: 'end',
      name: `结束 · ${selectedQ?.title?.slice(0, 12) ?? '本题'}`,
    })
    onEditRule(id)
  }

  if (!selectedQuestionId) {
    return (
      <div className='flex flex-col gap-3'>
        <BuilderGuidance
          className='flex flex-col items-center justify-center gap-1.5 py-10 text-center'
          density='compact'
          title='全卷逻辑'
          description='在此管理所有显示/隐藏与跳题规则。选中画布上的题目可快速为本题添加规则。'
        />
        <RuleList onEditRule={onEditRule} />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <p className='text-sm leading-none font-semibold tracking-tight'>
          本题逻辑
        </p>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          配置与「{selectedQ?.title || '未命名'}」相关的显隐与跳题规则。
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={priorSourceIds.length === 0}
            onClick={handleQuickShow}
          >
            当前题 · 按条件显示
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={!selectedQ || !canUseQuestionAsRuleSource(selectedQ)}
            onClick={handleQuickEnd}
          >
            本题作答后 · 结束问卷
          </Button>
        </div>
      </div>
      <RuleList questionId={selectedQuestionId} onEditRule={onEditRule} />
    </div>
  )
}
