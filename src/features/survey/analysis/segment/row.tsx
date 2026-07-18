import React from 'react'
import { AlertCircle, X, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
} from '@/features/survey/core/analysis-schema'
import { questionUsesOptions } from '@/features/survey/core/question-config'
import type { QuestionElement } from '@/features/survey/core/types'
import {
  getOperators,
  operatorNeedsValue,
  operatorNeedsSecondValue,
  getSelectionDescription,
  OPERATOR_LABELS,
} from './utils'
import type { ValidationIssue } from './validator'

interface DebouncedInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'value' | 'onChange'
> {
  value: string
  onChange: (value: string) => void
}

const DebouncedInput = React.memo(function DebouncedInput({
  value,
  onChange,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const debouncedOnChange = useDebouncedCallback(onChange, 150)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalValue(val)
    debouncedOnChange(val)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
})

interface SegmentRowProps {
  segmentId: string
  condition: SegmentCondition
  conditionIndex: number
  questions: QuestionElement[]
  questionOptions: { id: string; label: string }[]
  issue?: ValidationIssue
  onQuestionChange: (
    segmentId: string,
    conditionIndex: number,
    question: QuestionElement
  ) => void
  onOperatorChange: (
    segmentId: string,
    conditionIndex: number,
    question: QuestionElement,
    operator: SegmentConditionOperator
  ) => void
  onValueChange: (
    segmentId: string,
    conditionIndex: number,
    patch: Partial<SegmentCondition>
  ) => void
  onRemove: (segmentId: string, conditionIndex: number) => void
}

export const SegmentRow = React.memo(function SegmentRow({
  segmentId,
  condition,
  conditionIndex,
  questions,
  questionOptions,
  issue,
  onQuestionChange,
  onOperatorChange,
  onValueChange,
  onRemove,
}: SegmentRowProps) {
  const [open, setOpen] = React.useState(false)
  const question = questions.find((item) => item.id === condition.questionId)
  const operators = question ? getOperators(question) : []

  // 本地根据题型判定字段类型分类，简化原有 getFieldKind 抽象
  const isChoice = questionUsesOptions(question?.type ?? 'single_choice')
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

  const selectedOption = questionOptions.find(
    (opt) => opt.id === condition.questionId
  )

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open}
              className={cn(
                'border-muted/80 hover:border-muted-foreground/30 focus-visible:ring-ring bg-background h-8 w-full justify-between px-3 text-left text-xs font-normal shadow-none transition-colors duration-200 focus-visible:ring-1',
                !condition.questionId && 'text-muted-foreground',
                (isQuestionError || isConflictError) &&
                  'border-destructive/60 text-destructive focus-visible:ring-destructive'
              )}
            >
              <span className='mr-2 truncate'>
                {selectedOption ? selectedOption.label : '选择题目'}
              </span>
              <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[350px] p-0' align='start'>
            <Command>
              <CommandInput placeholder='搜索题目...' className='h-8 text-xs' />
              <CommandEmpty className='text-muted-foreground py-4 text-center text-xs'>
                未找到相关题目
              </CommandEmpty>
              <CommandList className='max-h-[260px] overflow-y-auto p-1'>
                <CommandGroup>
                  {questionOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => {
                        const nextQuestion = questions.find(
                          (item) => item.id === option.id
                        )
                        if (nextQuestion) {
                          onQuestionChange(
                            segmentId,
                            conditionIndex,
                            nextQuestion
                          )
                        }
                        setOpen(false)
                      }}
                      className='flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs'
                    >
                      <span className='truncate pr-4'>{option.label}</span>
                      {condition.questionId === option.id && (
                        <Check className='text-primary h-3.5 w-3.5 shrink-0' />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Select
        value={condition.operator}
        disabled={!question}
        onValueChange={(value) => {
          if (question)
            onOperatorChange(
              segmentId,
              conditionIndex,
              question,
              value as SegmentConditionOperator
            )
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
                <DebouncedInput
                  type={kind === 'number' ? 'number' : 'text'}
                  value={String(condition.value ?? '')}
                  onChange={(val) =>
                    onValueChange(segmentId, conditionIndex, { value: val })
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
                <DebouncedInput
                  type={kind === 'number' ? 'number' : 'text'}
                  value={String(condition.value2 ?? '')}
                  onChange={(val) =>
                    onValueChange(segmentId, conditionIndex, { value2: val })
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
                onValueChange={(value) =>
                  onValueChange(segmentId, conditionIndex, { value })
                }
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
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <DebouncedInput
                type={kind === 'number' ? 'number' : 'text'}
                value={String(condition.value ?? '')}
                onChange={(val) =>
                  onValueChange(segmentId, conditionIndex, { value: val })
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
          onClick={() => onRemove(segmentId, conditionIndex)}
        >
          <X className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
})
