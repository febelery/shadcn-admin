import type { QuestionElement } from '../../core/types'
import {
  isQuestionNumberVisible,
  isSurveyNumberingEnabled,
  SURVEY_NUMBERING_OPTIONS,
  type SurveyDefaultNumberingStyle,
} from '../../shared/question-numbering'
import { useBuilderStore } from '../store'
import { builderTypeCaption } from '../ui'
import { InspectorSwitchField } from './inspector-primitives'

type Props = {
  question: QuestionElement
  patch: (p: Partial<QuestionElement>) => void
}

/** 题号显隐 — 嵌入「展示与逻辑」分组 */
export function QuestionNumberingInspector({ question, patch }: Props) {
  const schema = useBuilderStore((s) => s.schema)!
  const surveyStyle =
    (schema.meta.defaultQuestionNumbering ?? 'decimal') as SurveyDefaultNumberingStyle
  const surveyEnabled = isSurveyNumberingEnabled(surveyStyle)
  const visible = isQuestionNumberVisible(question, surveyStyle)

  const surveyStyleLabel =
    SURVEY_NUMBERING_OPTIONS.find((o) => o.value === surveyStyle)?.label ??
    surveyStyle

  const setShow = (show: boolean) =>
    patch({
      numbering: { show },
    })

  if (!surveyEnabled) {
    return (
      <p className={builderTypeCaption}>
        全卷已关闭题号（问卷设置 → {surveyStyleLabel}）。可在画布点击题号区域切换单题显隐。
      </p>
    )
  }

  return (
    <InspectorSwitchField
      id={`show-number-${question.id}`}
      label='显示本题题号'
      description={`全卷样式：${surveyStyleLabel}，在「问卷设置」中修改`}
      checked={visible}
      onCheckedChange={(c) => setShow(!!c)}
    />
  )
}
