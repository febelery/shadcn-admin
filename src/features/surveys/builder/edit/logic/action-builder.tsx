import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RuleAction, RuleActionType } from '../../types'
import { useQuestionSelectOptions } from './use-survey-questions'

const ACTION_OPTIONS: { value: RuleActionType; label: string }[] = [
  { value: 'show', label: '显示题目' },
  { value: 'hide', label: '隐藏题目' },
  { value: 'jump_to_question', label: '跳转到题目' },
  { value: 'end', label: '结束问卷' },
]

type Props = {
  action: RuleAction
  onChange: (action: RuleAction) => void
  /** 跳转/显隐目标候选 */
  targetQuestionIds?: string[]
  defaultTargetId?: string
  /** 限制可选动作类型（流程右栏类型 Tab） */
  allowedTypes?: RuleActionType[]
}

export function ActionBuilder({
  action,
  onChange,
  targetQuestionIds,
  defaultTargetId,
  allowedTypes,
}: Props) {
  const targetOptions = useQuestionSelectOptions(targetQuestionIds)

  const actionOptions = allowedTypes
    ? ACTION_OPTIONS.filter((o) => allowedTypes.includes(o.value))
    : ACTION_OPTIONS

  const needsTarget =
    action.type === 'show' ||
    action.type === 'hide' ||
    action.type === 'jump_to_question'

  return (
    <div className='border-border/60 flex flex-col gap-3 rounded-lg border p-3'>
      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs'>则执行</Label>
        <Select
          value={action.type}
          onValueChange={(v) =>
            onChange({
              ...action,
              type: v as RuleActionType,
              target:
                v === 'end' ? undefined : (action.target ?? defaultTargetId),
            })
          }
        >
          <SelectTrigger className='h-9'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {needsTarget ? (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>目标题目</Label>
          <Select
            value={action.target ?? defaultTargetId ?? ''}
            onValueChange={(v) => onChange({ ...action, target: v })}
          >
            <SelectTrigger className='h-9'>
              <SelectValue placeholder='选择目标题目' />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}
