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
import { useBuilderStatic } from '../../context'
import type {
  Condition,
  ConditionGroup,
  ConditionOperator,
  QuestionElement,
} from '../../types'
import {
  useSurveyQuestions,
  useQuestionSelectOptions,
} from './use-survey-questions'

type Props = {
  when: string
  onWhenChange: (when: string) => void
  /** 限制可选条件题（如必须在目标题之前） */
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

function ConditionRow({
  condition,
  onChange,
  allowedSourceIds,
  defaultSourceId,
}: {
  condition: Condition
  onChange: (c: Condition) => void
  allowedSourceIds?: string[]
  defaultSourceId?: string
}) {
  const { getOperatorsForQuestionType, supportsVisualCondition } =
    useBuilderStatic()
  const questions = useSurveyQuestions()
  const sourceOptions = useQuestionSelectOptions(allowedSourceIds)

  const effectiveRef =
    sourceOptions.some((o) => o.id === condition.ref) || !defaultSourceId
      ? condition.ref || defaultSourceId || ''
      : defaultSourceId
  const selectedQ = questions.find((q) => q.id === effectiveRef)
  const operators = selectedQ
    ? getOperatorsForQuestionType(selectedQ.type)
    : getOperatorsForQuestionType('text')
  const opDef = operators.find((o) => o.value === condition.operator)

  const pickSource = (id: string) => {
    const q = questions.find((x) => x.id === id)
    const ops = q ? getOperatorsForQuestionType(q.type) : []
    onChange({
      ...condition,
      ref: id,
      operator: ops[0]?.value ?? 'eq',
      value: '',
    })
  }

  return (
    <div className='flex max-w-full min-w-0 flex-col gap-2 overflow-hidden'>
      <FieldRow label='题目'>
        {sourceOptions.length === 0 ? (
          <p className='bg-muted/30 text-muted-foreground rounded-md px-2.5 py-2 text-xs leading-relaxed'>
            暂无可作为条件题的题目，请先添加支持规则的题型。
          </p>
        ) : (
          <Select value={effectiveRef} onValueChange={pickSource}>
            <SelectTrigger className='h-9'>
              <SelectValue placeholder='选择条件题目' />
            </SelectTrigger>
            <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
              {sourceOptions.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  <span className='block max-w-full truncate'>{label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FieldRow>
      {selectedQ && supportsVisualCondition(selectedQ.type) ? (
        <>
          <FieldRow label='关系'>
            <Select
              value={condition.operator}
              onValueChange={(v) =>
                onChange({
                  ...condition,
                  ref: effectiveRef,
                  operator: v as ConditionOperator,
                })
              }
            >
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                {operators.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className='block max-w-full truncate'>{o.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          {opDef?.needsValue ? (
            <FieldRow label='值'>
              {hasOptions(selectedQ) ? (
                <Select
                  value={condition.value ?? ''}
                  onValueChange={(v) =>
                    onChange({ ...condition, ref: effectiveRef, value: v })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='选择选项' />
                  </SelectTrigger>
                  <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                    {(selectedQ.config.options ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        <span className='block max-w-full truncate'>
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className='h-9 min-w-0'
                  value={condition.value ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...condition,
                      ref: effectiveRef,
                      value: e.target.value,
                    })
                  }
                  placeholder='输入比较值'
                />
              )}
            </FieldRow>
          ) : null}
        </>
      ) : selectedQ ? (
        <p className='text-muted-foreground bg-muted/30 rounded-md px-2.5 py-2 text-xs leading-relaxed'>
          该题型暂不支持可视化条件，请使用下方高级表达式。
        </p>
      ) : null}
    </div>
  )
}

function hasOptions(q: QuestionElement): boolean {
  return (
    (q.type === 'single_choice' ||
      q.type === 'dropdown' ||
      q.type === 'multiple_choice') &&
    (q.config.options?.length ?? 0) > 0
  )
}

export function ConditionBuilder({
  when,
  onWhenChange,
  allowedSourceIds,
  defaultSourceId,
}: Props) {
  const { tryParseSimpleCondition, serializeConditionGroup } =
    useBuilderStatic()
  const parsed = tryParseSimpleCondition(when)
  const group: ConditionGroup = parsed ?? {
    logic: 'and',
    items: [
      {
        source: 'q',
        ref: defaultSourceId ?? '',
        operator: 'eq',
        value: '',
      },
    ],
  }

  const applyGroup = (next: ConditionGroup) => {
    onWhenChange(serializeConditionGroup(next))
  }

  const item = group.items[0] ?? {
    source: 'q' as const,
    ref: defaultSourceId ?? '',
    operator: 'eq' as ConditionOperator,
    value: '',
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
          <div className='border-t px-2.5 py-2.5'>
            <ConditionRow
              condition={item}
              onChange={(c) => applyGroup({ ...group, items: [c] })}
              allowedSourceIds={allowedSourceIds}
              defaultSourceId={defaultSourceId}
            />
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}
