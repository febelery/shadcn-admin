import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  isQuestionNumberVisible,
  getQuestionNumberLabel,
} from '@/features/survey/core/question-numbering'
import { getQuestionNumberTextClass } from '@/features/survey/shared/numbering-options'
import { questionNumberColumn } from '@/features/survey/shared/question-layout'
import type {
  QuestionElement,
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../../types'

/** 画布题号区点击 — 不触发题目选中 */
export const QUESTION_NUMBER_TOGGLE_ATTR = 'data-question-number-toggle'

type Props = {
  question: QuestionElement
  /** 填写端展示序号；连续模式且隐藏时为 null */
  displayOrdinal: number | null
  /** 卷内全局序号（编辑器对照） */
  globalOrdinal: number
  numberingMode: QuestionNumberingMode
  surveyDefaultNumbering: SurveyDefaultNumberingStyle
  onToggle: () => void
}

/** 画布题号 — 点击切换显隐；隐藏时淡化显示对照序号 */
export function SurfaceQuestionNumberToggle({
  question,
  displayOrdinal,
  globalOrdinal,
  numberingMode,
  surveyDefaultNumbering,
  onToggle,
}: Props) {
  const visible = isQuestionNumberVisible(question, surveyDefaultNumbering)
  const showGlobalReference =
    !visible && numberingMode === 'continuous' && displayOrdinal == null

  const ordinalForLabel = visible ? displayOrdinal : globalOrdinal
  const label =
    ordinalForLabel != null
      ? getQuestionNumberLabel(ordinalForLabel, surveyDefaultNumbering)
      : null

  if (!label) return null

  const tooltip = visible
    ? '隐藏本题题号'
    : numberingMode === 'continuous'
      ? `显示本题题号（连续编号，卷内第 ${globalOrdinal} 题）`
      : '显示本题题号'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          {...{ [QUESTION_NUMBER_TOGGLE_ATTR]: '' }}
          className={cn(
            questionNumberColumn,
            'hover:bg-muted/70 rounded-sm transition-colors',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
          )}
          aria-label={tooltip}
          aria-pressed={visible}
          onPointerDown={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={cn(
              getQuestionNumberTextClass(surveyDefaultNumbering),
              !visible && 'text-muted-foreground/20'
            )}
          >
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side='top'
        className={cn('max-w-xs', 'text-xs leading-none')}
      >
        {tooltip}
        {showGlobalReference ? (
          <span className='text-muted-foreground mt-1 block'>
            * 卷内第 {globalOrdinal} 题，连续编号下不占题号
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}
