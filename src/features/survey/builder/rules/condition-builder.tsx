import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getRuleOperatorsForQuestionType,
  isPresenceConditionOperator,
} from '@/features/survey/core/logic/operators'
import type {
  QuestionElement,
  RuleCondition,
  RuleConditionOperator,
} from '../../core/types'
import { useSurveyQuestionCatalog } from './use-survey-questions'

type Props = {
  condition: RuleCondition
  onConditionChange: (condition: RuleCondition) => void
  allowedSourceIds?: string[]
  defaultSourceId?: string
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2'>
      <Label className='text-muted-foreground text-[11px] leading-none'>
        {label}
      </Label>
      <div className='min-w-0'>{children}</div>
    </div>
  )
}

function createCondition(
  questionId: string,
  operator: RuleConditionOperator,
  current?: RuleCondition
): RuleCondition {
  if (isPresenceConditionOperator(operator)) {
    return { questionId, operator }
  }
  return {
    questionId,
    operator,
    value: current && 'value' in current ? current.value : '',
  }
}

function usesNumericValue(question: QuestionElement): boolean {
  return ['number', 'rating', 'slider', 'nps'].includes(question.type)
}

function hasOptions(question: QuestionElement): boolean {
  return (
    ['single_choice', 'dropdown', 'multiple_choice'].includes(question.type) &&
    (question.config.options?.length ?? 0) > 0
  )
}

export function ConditionBuilder({
  condition,
  onConditionChange,
  allowedSourceIds,
  defaultSourceId,
}: Props) {
  const { questionsById, selectOptions: sourceOptions } =
    useSurveyQuestionCatalog(allowedSourceIds)
  const questionId = sourceOptions.some(
    (option) => option.id === condition.questionId
  )
    ? condition.questionId
    : (defaultSourceId ?? sourceOptions[0]?.id ?? '')
  const question = questionsById.get(questionId)
  const operators = question
    ? getRuleOperatorsForQuestionType(question.type)
    : []
  const activeOperator = operators.some(
    (operator) => operator.value === condition.operator
  )
    ? condition.operator
    : operators[0]?.value
  const operatorDefinition = operators.find(
    (operator) => operator.value === activeOperator
  )

  const pickQuestion = (nextQuestionId: string) => {
    const nextQuestion = questionsById.get(nextQuestionId)
    const nextOperator = nextQuestion
      ? getRuleOperatorsForQuestionType(nextQuestion.type)[0]?.value
      : undefined
    if (nextOperator) {
      onConditionChange(createCondition(nextQuestionId, nextOperator))
    }
  }

  return (
    <Collapsible defaultOpen className='group/rule-section'>
      <section className='border-border/70 bg-background flex min-w-0 flex-col overflow-hidden rounded-md border'>
        <CollapsibleTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            className='hover:bg-muted/50 flex h-10 w-full items-center justify-between rounded-none px-2.5'
          >
            <div className='flex min-w-0 items-center gap-2'>
              <span className='bg-primary/10 text-primary flex h-5 min-w-7 items-center justify-center rounded px-1.5 text-[10px] leading-none font-semibold tracking-wide'>
                IF
              </span>
              <p className='text-xs leading-none font-medium'>条件</p>
            </div>
            <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/rule-section:rotate-180' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='overflow-hidden'>
          <div className='flex flex-col gap-2 border-t px-2.5 py-2.5'>
            <FieldRow label='题目'>
              {sourceOptions.length === 0 ? (
                <p className='bg-muted/30 text-muted-foreground rounded-md px-2.5 py-2 text-xs leading-relaxed'>
                  暂无可作为条件的题目
                </p>
              ) : (
                <Select value={questionId} onValueChange={pickQuestion}>
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='选择条件题目' />
                  </SelectTrigger>
                  <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                    {sourceOptions.map(({ id, label }) => (
                      <SelectItem key={id} value={id}>
                        <span className='block max-w-full truncate'>
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FieldRow>

            {question && activeOperator ? (
              <>
                <FieldRow label='关系'>
                  <Select
                    value={activeOperator}
                    onValueChange={(value) =>
                      onConditionChange(
                        createCondition(
                          questionId,
                          value as RuleConditionOperator,
                          condition
                        )
                      )
                    }
                  >
                    <SelectTrigger className='h-9'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                      {operators.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>

                {operatorDefinition?.needsValue && 'value' in condition ? (
                  <FieldRow label='值'>
                    {hasOptions(question) ? (
                      <Select
                        value={String(condition.value)}
                        onValueChange={(value) =>
                          onConditionChange({
                            questionId,
                            operator: activeOperator,
                            value,
                          })
                        }
                      >
                        <SelectTrigger className='h-9'>
                          <SelectValue placeholder='选择选项' />
                        </SelectTrigger>
                        <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                          {(question.config.options ?? []).map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={
                          question.type === 'date'
                            ? 'date'
                            : usesNumericValue(question)
                              ? 'number'
                              : 'text'
                        }
                        className='h-9 min-w-0'
                        value={condition.value}
                        onChange={(event) =>
                          onConditionChange({
                            questionId,
                            operator: activeOperator,
                            value: usesNumericValue(question)
                              ? event.target.value === ''
                                ? ''
                                : event.target.valueAsNumber
                              : event.target.value,
                          })
                        }
                        placeholder='输入比较值'
                      />
                    )}
                  </FieldRow>
                ) : null}
              </>
            ) : null}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}
