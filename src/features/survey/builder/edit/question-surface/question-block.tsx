import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  questionBlockStack,
  questionBlockGridRequiredOnly,
  questionBlockContentCol,
  questionHeaderLineHeight,
  questionOptionsWrap,
  questionBlockGrid,
  questionPrefixCluster,
  questionNumberColumn,
  questionTitleText,
} from '@/features/survey/shared/question-layout'
import {
  isSurveyNumberingEnabled,
  isQuestionNumberVisible,
} from '@/features/survey/shared/question-numbering'
import { QuestionRequiredMark } from '@/features/survey/shared/question-required-mark'
import { LABEL_LIMITS } from '../../store'
import type {
  QuestionContentPatch,
  QuestionConfigPatch,
  QuestionElement,
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../../types'
import { InlineEditable } from '../inline-editable'
import { SurfaceQuestionNumberToggle } from './question-number-toggle'
import { QuestionSurfaceBody } from './registry'

type Props = {
  question: QuestionElement
  displayOrdinal: number | null
  globalOrdinal: number
  numberingMode: QuestionNumberingMode
  surveyDefaultNumbering: SurveyDefaultNumberingStyle
  selected: boolean
  onPatch: (patch: QuestionContentPatch) => void
  onConfigChange: (patch: QuestionConfigPatch) => void
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
      className={cn(
        'text-sm leading-relaxed',
        'text-muted-foreground min-h-[1.25em] max-w-full'
      )}
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

type LayoutProps = {
  required?: boolean
  requiredMark?: ReactNode
  numberSlot?: ReactNode | null
  reserveNumberColumn?: boolean
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}

function QuestionBlockLayout({
  required = false,
  requiredMark,
  numberSlot,
  reserveNumberColumn = false,
  title,
  description,
  children,
  className,
}: LayoutProps) {
  // 使用静态导入的布局排版样式常数

  const useNumberGrid = reserveNumberColumn || numberSlot != null
  const mark = requiredMark ?? <QuestionRequiredMark required={required} />

  if (!useNumberGrid) {
    return (
      <div className={cn(questionBlockStack, className)}>
        <div className={questionBlockGridRequiredOnly}>
          {mark}
          <div
            className={cn(
              questionBlockContentCol,
              questionHeaderLineHeight,
              'flex min-w-0 items-center'
            )}
          >
            {title}
          </div>
        </div>
        {description}
        <div className={questionOptionsWrap}>{children}</div>
      </div>
    )
  }

  return (
    <div className={cn(questionBlockGrid, className)}>
      <div className={questionPrefixCluster}>
        {mark}
        {numberSlot ?? <span className={questionNumberColumn} aria-hidden />}
      </div>
      <div
        className={cn(questionBlockContentCol, 'flex min-w-0 flex-col gap-1.5')}
      >
        <div
          className={cn(questionHeaderLineHeight, 'flex min-w-0 items-center')}
        >
          {title}
        </div>
        {description}
        <div className={questionOptionsWrap}>{children}</div>
      </div>
    </div>
  )
}
