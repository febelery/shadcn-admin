import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  SegmentCondition,
  SegmentConditionOperator,
} from '@/features/survey/core/analysis-types'
import { isChoiceQuestionType } from '@/features/survey/core/question-capabilities'
import type {
  QuestionElement,
  SurveySchema,
} from '@/features/survey/core/types'
import {
  getOperators,
  operatorNeedsValue,
  operatorNeedsSecondValue,
  getSelectionDescription,
  getQuestionLabel,
  OPERATOR_LABELS,
} from './utils'
import type { ValidationIssue } from './validator'

function QuestionLabel({
  question,
  schema,
  questions,
}: {
  question: QuestionElement
  schema: SurveySchema
  questions: QuestionElement[]
}) {
  const label = getQuestionLabel(question, schema, questions)
  return (
    <span className='text-foreground truncate text-xs font-medium'>
      {label}
    </span>
  )
}

interface SegmentRowProps {
  condition: SegmentCondition
  conditionIndex: number
  questions: QuestionElement[]
  schema: SurveySchema
  allQuestions: QuestionElement[]
  issue?: ValidationIssue
  onQuestionChange: (question: QuestionElement) => void
  onOperatorChange: (
    operator: SegmentConditionOperator,
    question: QuestionElement
  ) => void
  onValueChange: (patch: Partial<SegmentCondition>) => void
  onRemove: () => void
}

export function SegmentRow({
  condition,
  conditionIndex,
  questions,
  schema,
  allQuestions,
  issue,
  onQuestionChange,
  onOperatorChange,
  onValueChange,
  onRemove,
}: SegmentRowProps) {
  const question = questions.find((item) => item.id === condition.questionId)
  const operators = question ? getOperators(question) : []

  // 本地根据题型判定字段类型分类，简化原有 getFieldKind 抽象
  const isChoice = isChoiceQuestionType(question?.type ?? 'single_choice')
  const isMulti = question?.type === 'multiple_choice'
  const isNumber =
    question?.type === 'number' ||
    question?.type === 'rating' ||
    question?.type === 'slider' ||
    question?.type === 'nps'
  const kind = isChoice
    ? 'choice'
    : isMulti
      ? 'multi'
      : isNumber
        ? 'number'
        : 'text'

  const isQuestionError =
    issue && (issue.id.endsWith('-question') || issue.id.endsWith('-missing'))
  const isOperatorError = issue && issue.id.endsWith('-operator')
  const isValueError =
    issue && (issue.id.endsWith('-value') || issue.id.endsWith('-value2'))
  const isConflictError = issue && issue.id.endsWith('-conflict')

  return (
    <div
      className={cn(
        'border-muted/40 bg-background relative flex flex-col gap-2.5 border-b p-3.5 transition-colors duration-200',
        'lg:border-muted/40 lg:hover:bg-muted/15 lg:grid lg:grid-cols-[56px_1.5fr_100px_1.2fr_40px] lg:items-center lg:gap-3 lg:border-b lg:bg-transparent lg:px-4 lg:py-2 lg:last:border-b-0',
        issue ? 'bg-destructive/5 dark:bg-destructive/10' : ''
      )}
    >
      <div className='flex items-center lg:h-9'>
        <Badge
          variant={conditionIndex === 0 ? 'secondary' : 'outline'}
          className={cn(
            'h-5 rounded px-1.5 text-[10px] font-medium tracking-wide',
            conditionIndex === 0
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'text-muted-foreground border-muted/80 bg-muted/20'
          )}
        >
          {conditionIndex === 0 ? '条件 1' : '并且'}
        </Badge>
      </div>
      <div className='min-w-0 pr-8 lg:pr-0'>
        <Select
          value={condition.questionId}
          onValueChange={(questionId) => {
            const nextQuestion = questions.find(
              (item) => item.id === questionId
            )
            if (nextQuestion) onQuestionChange(nextQuestion)
          }}
        >
          <SelectTrigger
            className={cn(
              'border-muted/80 hover:border-muted-foreground/30 focus:ring-ring h-8 text-xs shadow-none transition-colors duration-200 focus:ring-1',
              (isQuestionError || isConflictError) &&
                'border-destructive/60 text-destructive focus:ring-destructive focus-visible:ring-destructive/30'
            )}
          >
            <SelectValue placeholder='选择题目' />
          </SelectTrigger>
          <SelectContent>
            {questions.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <QuestionLabel
                  question={item}
                  schema={schema}
                  questions={allQuestions}
                />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select
        value={condition.operator}
        disabled={!question}
        onValueChange={(value) => {
          if (question)
            onOperatorChange(value as SegmentConditionOperator, question)
        }}
      >
        <SelectTrigger
          className={cn(
            'border-muted/80 hover:border-muted-foreground/30 focus:ring-ring h-8 text-xs shadow-none transition-colors duration-200 focus:ring-1',
            (isOperatorError || isConflictError) &&
              'border-destructive/60 text-destructive focus:ring-destructive focus-visible:ring-destructive/30'
          )}
        >
          <SelectValue placeholder='操作符' />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem key={operator} value={operator}>
              {OPERATOR_LABELS[operator]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className='min-w-0'>
        {question ? (
          operatorNeedsValue(condition.operator) ? (
            operatorNeedsSecondValue(condition.operator) ? (
              <div className='flex items-center gap-1.5'>
                <Input
                  type={kind === 'number' ? 'number' : 'text'}
                  value={condition.value ?? ''}
                  onChange={(event) =>
                    onValueChange({ value: event.target.value })
                  }
                  className={cn(
                    'border-muted/80 focus-visible:ring-ring h-8 w-24 text-xs shadow-none transition-colors duration-200 focus-visible:ring-1',
                    (isValueError || isConflictError) &&
                      'border-destructive/60 focus-visible:ring-destructive text-destructive'
                  )}
                  placeholder='最小值'
                />
                <span className='text-muted-foreground shrink-0 text-[10px]'>
                  至
                </span>
                <Input
                  type={kind === 'number' ? 'number' : 'text'}
                  value={condition.value2 ?? ''}
                  onChange={(event) =>
                    onValueChange({ value2: event.target.value })
                  }
                  className={cn(
                    'border-muted/80 focus-visible:ring-ring h-8 w-24 text-xs shadow-none transition-colors duration-200 focus-visible:ring-1',
                    (isValueError || isConflictError) &&
                      'border-destructive/60 focus-visible:ring-destructive text-destructive'
                  )}
                  placeholder='最大值'
                />
              </div>
            ) : kind === 'choice' || kind === 'multi' ? (
              <Select
                value={String(condition.value ?? '')}
                onValueChange={(value) => onValueChange({ value })}
              >
                <SelectTrigger
                  className={cn(
                    'border-muted/80 hover:border-muted-foreground/30 focus:ring-ring h-8 text-xs shadow-none transition-colors duration-200 focus:ring-1',
                    (isValueError || isConflictError) &&
                      'border-destructive/60 text-destructive focus:ring-destructive'
                  )}
                >
                  <SelectValue placeholder='选择答案' />
                </SelectTrigger>
                <SelectContent>
                  {question.config?.options?.map((option) => (
                    <SelectItem
                      key={option.id ?? option.label}
                      value={option.label}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={kind === 'number' ? 'number' : 'text'}
                value={condition.value ?? ''}
                onChange={(event) =>
                  onValueChange({ value: event.target.value })
                }
                className={cn(
                  'border-muted/80 focus-visible:ring-ring h-8 text-xs shadow-none transition-colors duration-200 focus-visible:ring-1',
                  (isValueError || isConflictError) &&
                    'border-destructive/60 focus-visible:ring-destructive text-destructive'
                )}
                placeholder={kind === 'number' ? '输入数值' : '输入内容'}
              />
            )
          ) : (
            <div className='text-muted-foreground bg-muted/30 border-muted/60 flex h-8 items-center rounded border px-2.5 text-xs'>
              {getSelectionDescription(condition, question)}
            </div>
          )
        ) : (
          <div className='text-muted-foreground bg-muted/20 border-muted/50 flex h-8 items-center rounded border border-dashed px-2.5 text-xs'>
            请先选择左侧题目
          </div>
        )}
      </div>

      <div className='absolute top-3.5 right-3.5 flex shrink-0 items-center gap-1.5 lg:static lg:h-8 lg:w-full lg:justify-end'>
        {issue && (
          <span title={issue.message} className='inline-flex shrink-0'>
            <AlertCircle className='text-destructive h-4 w-4 cursor-help transition-transform hover:scale-110' />
          </span>
        )}
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-destructive hover:bg-muted/80 h-7 w-7 rounded'
          onClick={onRemove}
        >
          <X className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
}
