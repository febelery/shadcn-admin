import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  Condition,
  ConditionGroup,
  ConditionOperator,
  QuestionElement,
} from '../../types'
import { useBuilderStatic } from '../context'
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

  const selectedQ = questions.find((q) => q.id === condition.ref)
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
    <div className='border-border/60 flex flex-col gap-2 rounded-lg border p-3'>
      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs'>条件题目</Label>
        {sourceOptions.length === 0 ? (
          <p className='text-muted-foreground text-xs leading-relaxed'>
            目标为第一题时无法选前置题目，请填写下方高级表达式。
          </p>
        ) : (
          <Select
            value={condition.ref || defaultSourceId || ''}
            onValueChange={pickSource}
          >
            <SelectTrigger className='h-9'>
              <SelectValue placeholder='选择条件题目' />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {selectedQ && supportsVisualCondition(selectedQ.type) ? (
        <>
          <div className='flex flex-col gap-1.5'>
            <Label className='text-xs'>运算符</Label>
            <Select
              value={condition.operator}
              onValueChange={(v) =>
                onChange({ ...condition, operator: v as ConditionOperator })
              }
            >
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {opDef?.needsValue ? (
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs'>值</Label>
              {hasOptions(selectedQ) ? (
                <Select
                  value={condition.value ?? ''}
                  onValueChange={(v) => onChange({ ...condition, value: v })}
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='选择选项' />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedQ.config.options ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className='h-9'
                  value={condition.value ?? ''}
                  onChange={(e) =>
                    onChange({ ...condition, value: e.target.value })
                  }
                  placeholder='输入比较值'
                />
              )}
            </div>
          ) : null}
        </>
      ) : selectedQ ? (
        <p className='text-muted-foreground text-xs leading-relaxed'>
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
  const { tryParseSimpleCondition, serializeConditionGroup } = useBuilderStatic()
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
    <div className='flex flex-col gap-3'>
      <ConditionRow
        condition={item}
        onChange={(c) => applyGroup({ ...group, items: [c] })}
        allowedSourceIds={allowedSourceIds}
        defaultSourceId={defaultSourceId}
      />
      <div className='flex flex-col gap-1.5'>
        <Label className='text-muted-foreground text-xs'>
          高级表达式（可选）
        </Label>
        <Textarea
          rows={2}
          className='font-mono text-xs'
          value={when}
          onChange={(e) => onWhenChange(e.target.value)}
          placeholder="{q.题目ID} = 'value'"
        />
      </div>
    </div>
  )
}
