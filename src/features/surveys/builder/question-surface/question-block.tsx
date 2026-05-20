import type {
  QuestionElement,
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../../core/types'
import { QuestionBlockLayout } from '../../shared/question-block-layout'
import { questionTitleText } from '../../shared/question-layout'
import {
  isQuestionNumberVisible,
  isSurveyNumberingEnabled,
} from '../../shared/question-numbering'
import { QuestionRequiredMark } from '../../shared/question-required-mark'
import { LABEL_LIMITS } from '../label-limits'
import { QuestionSurfaceBody } from '../question-surface-registry'
import { InlineEditable } from './inline-editable'
import { SurfaceQuestionNumberToggle } from './question-number-toggle'

type Props = {
  question: QuestionElement
  displayOrdinal: number | null
  globalOrdinal: number
  numberingMode: QuestionNumberingMode
  surveyDefaultNumbering: SurveyDefaultNumberingStyle
  selected: boolean
  onPatch: (patch: Partial<QuestionElement>) => void
  onConfigChange: (patch: Partial<QuestionElement['config']>) => void
}

/** 题目作答区 Surface：试卷式悬挂缩进，说明/选项与标题左缘对齐 */
export function SurfaceQuestionBlock({
  question,
  displayOrdinal,
  globalOrdinal,
  numberingMode,
  surveyDefaultNumbering,
  selected,
  onPatch,
  onConfigChange,
}: Props) {
  const showDescription = Boolean(question.description || selected)
  const reserveNumberColumn = isSurveyNumberingEnabled(surveyDefaultNumbering)

  const title = (
    <InlineEditable
      value={question.title}
      onChange={(title) => onPatch({ title })}
      placeholder='请输入题目'
      maxLength={LABEL_LIMITS.questionTitle}
      className={`min-w-0 ${questionTitleText}`}
      autoFocus={selected && !question.title}
    />
  )

  const description = showDescription ? (
    <InlineEditable
      value={question.description ?? ''}
      onChange={(description) =>
        onPatch({ description: description || undefined })
      }
      placeholder='添加说明（选填）'
      multiline
      maxLength={LABEL_LIMITS.questionDescription}
      className='text-muted-foreground min-h-[1.25em] max-w-full text-sm leading-relaxed'
    />
  ) : undefined

  return (
    <QuestionBlockLayout
      requiredMark={
        <QuestionRequiredMark
          required={question.required}
          onToggle={() => onPatch({ required: !question.required })}
        />
      }
      reserveNumberColumn={reserveNumberColumn}
      numberSlot={
        reserveNumberColumn ? (
          <SurfaceQuestionNumberToggle
            question={question}
            displayOrdinal={displayOrdinal}
            globalOrdinal={globalOrdinal}
            numberingMode={numberingMode}
            surveyDefaultNumbering={surveyDefaultNumbering}
            onToggle={() => {
              const visible = isQuestionNumberVisible(
                question,
                surveyDefaultNumbering
              )
              onPatch({ numbering: { show: !visible } })
            }}
          />
        ) : null
      }
      title={title}
      description={description}
    >
      <QuestionSurfaceBody
        question={question}
        onConfigChange={onConfigChange}
      />
    </QuestionBlockLayout>
  )
}
