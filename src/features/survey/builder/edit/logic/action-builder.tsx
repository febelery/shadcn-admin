import { useMemo, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

export function ActionBuilder({
  action,
  onChange,
  targetQuestionIds,
  defaultTargetId,
  allowedTypes,
}: Props) {
  const targetOptions = useQuestionSelectOptions(targetQuestionIds)
  const selectedTargetLabel = useMemo(() => {
    const selectedId = action.target ?? defaultTargetId ?? ''
    return targetOptions.find((o) => o.id === selectedId)?.label
  }, [action.target, defaultTargetId, targetOptions])

  const actionOptions = allowedTypes
    ? ACTION_OPTIONS.filter((o) => allowedTypes.includes(o.value))
    : ACTION_OPTIONS
  const showActionSelect = actionOptions.length !== 1

  const needsTarget =
    action.type === 'show' ||
    action.type === 'hide' ||
    action.type === 'jump_to_question'
  const hasTargetOptions = targetOptions.length > 0

  return (
    <Collapsible defaultOpen className='group/rule-section'>
      <section className='border-border/70 bg-background flex max-w-full min-w-0 flex-col overflow-hidden rounded-md border'>
        <CollapsibleTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            className='hover:bg-muted/50 flex h-10 w-full items-center justify-between rounded-none px-2.5'
          >
            <div className='flex min-w-0 items-center gap-2'>
              <span className='flex h-5 min-w-7 items-center justify-center rounded bg-emerald-500/10 px-1.5 text-[10px] leading-none font-semibold tracking-wide text-emerald-700 dark:text-emerald-400'>
                THEN
              </span>
              <p className='text-xs leading-none font-medium'>执行</p>
            </div>
            <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/rule-section:rotate-180' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='overflow-hidden'>
          <div className='flex max-w-full min-w-0 flex-col gap-2.5 border-t px-2.5 py-2.5'>
            {showActionSelect ? (
              <FieldRow label='动作'>
                <Select
                  value={action.type}
                  onValueChange={(v) =>
                    onChange({
                      ...action,
                      type: v as RuleActionType,
                      target:
                        v === 'end'
                          ? undefined
                          : (action.target ?? defaultTargetId),
                    })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                    {actionOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className='block max-w-full truncate'>
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            ) : null}
            {needsTarget ? (
              <FieldRow label='目标'>
                {hasTargetOptions ? (
                  <Select
                    value={action.target ?? defaultTargetId ?? ''}
                    onValueChange={(v) => onChange({ ...action, target: v })}
                  >
                    <SelectTrigger
                      className='h-9 max-w-full min-w-0 overflow-hidden [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate'
                      title={selectedTargetLabel}
                    >
                      <SelectValue
                        placeholder='选择目标题目'
                        className='min-w-0 truncate'
                      />
                    </SelectTrigger>
                    <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                      {targetOptions.map(({ id, label }) => (
                        <SelectItem key={id} value={id}>
                          <span className='block max-w-full truncate'>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className='text-muted-foreground bg-muted/30 rounded-md px-2.5 py-2 text-xs leading-relaxed'>
                    当前条件题之后没有可用目标。
                  </p>
                )}
              </FieldRow>
            ) : (
              <div className='grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2'>
                <span className='text-muted-foreground text-[11px] leading-none'>
                  结果
                </span>
                <p className='text-muted-foreground bg-muted/30 rounded-md px-2.5 py-2 text-xs leading-relaxed'>
                  命中条件后直接结束问卷。
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}
