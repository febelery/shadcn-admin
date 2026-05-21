import type { KeyboardEvent } from 'react'
import { Circle, GripVertical, Square, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { LABEL_LIMITS } from '../../store'
import type { ChoiceOption, QuestionConfig, QuestionElement } from '../../types'
import { useBuilderStatic } from '../../context'
import { InlineEditable } from '../inline-editable'
import { useChoiceOptions } from './use-choice-options'

type Props = {
  question: QuestionElement
  mode: 'single' | 'multiple'
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
  onConfigChange?: (patch: Partial<QuestionConfig>) => void
  showAllowOther?: boolean
}

/** 单选 / 多选 — 画布选项列表 */
export function SurfaceChoiceList({
  question,
  mode,
  options,
  onChange,
  onConfigChange,
  showAllowOther = false,
}: Props) {
  const {
    DEFAULT_OTHER_LABEL,
    isOtherOption,
    partitionChoiceOptions,
    syncOtherChoiceOption,
  } = useBuilderStatic()

  const {
    allowOther = false,
    otherLabel = DEFAULT_OTHER_LABEL,
    optionLayout,
  } = question.config

  const {
    setRowRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLastRegular,
    focusPreviousOption,
  } = useChoiceOptions({
    options,
    onChange,
    allowOther,
    otherLabel,
  })

  const toggleAllowOther = () => {
    const on = !allowOther
    onConfigChange?.({
      allowOther: on,
      options: syncOtherChoiceOption(
        partitionChoiceOptions(options).regular,
        on,
        otherLabel
      ),
    })
  }

  const handleOptionKeyDown =
    (index: number, id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        insertOptionAfter(index)
      }
      if (e.key === 'Backspace' && (e.currentTarget.textContent ?? '') === '') {
        if (options.length > 1 && !isOtherOption(options[index]!)) {
          e.preventDefault()
          removeOption(id)
          focusPreviousOption(index)
        }
      }
    }

  const layoutClass =
    optionLayout === 'horizontal'
      ? 'flex flex-wrap gap-x-6 gap-y-3'
      : 'flex flex-col gap-3'

  const Icon = mode === 'single' ? Circle : Square

  return (
    <>
      <ul className={cn('list-none', layoutClass)}>
        {options.map((opt, index) => (
          <li
            key={opt.id}
            ref={(el) => setRowRef(opt.id, el)}
            className='group/option flex flex-col gap-1 py-0.5'
          >
            <div className='grid grid-cols-[1.25rem_1fr_1.75rem] items-center gap-x-3'>
              <Icon className='text-muted-foreground size-4.5 shrink-0 stroke-[1.5]' />
              <InlineEditable
                value={opt.label}
                onChange={(label) => updateOptionLabel(opt.id, label)}
                placeholder={`选项 ${index + 1}`}
                maxLength={LABEL_LIMITS.choiceOption}
                className='text-foreground placeholder:text-muted-foreground/50 min-w-0 text-sm leading-relaxed font-normal'
                onKeyDown={handleOptionKeyDown(index, opt.id)}
              />
              {options.length > 1 && !isOtherOption(opt) ? (
                <button
                  type='button'
                  className='text-muted-foreground hover:text-destructive flex size-7 items-center justify-center rounded opacity-0 group-hover/option:opacity-100'
                  aria-label='删除选项'
                  data-surface-chrome
                  onClick={() => removeOption(opt.id)}
                >
                  <Trash2 className='size-3.5' />
                </button>
              ) : (
                <span className='size-7 shrink-0' />
              )}
            </div>
          </li>
        ))}
        <li>
          <button
            type='button'
            className='leading-relaxedtext-muted-foreground hover:text-foreground flex items-center gap-1.5 py-0.5 text-sm'
            data-surface-chrome
            onClick={() => insertAfterLastRegular()}
          >
            + 添加选项
          </button>
        </li>
      </ul>
      {showAllowOther && onConfigChange ? (
        <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-sm leading-relaxed'>
          <Checkbox
            checked={allowOther}
            data-surface-chrome
            onCheckedChange={() => toggleAllowOther()}
          />
          允许「其他」自填
        </label>
      ) : null}
    </>
  )
}

/** 排序题：可编辑列表 + 拖动手柄示意 */
export function SurfaceRankingList({
  options,
  onChange,
}: {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}) {
  const { createQuestionId } = useBuilderStatic()
  const { updateOptionLabel, insertOptionAfter } = useChoiceOptions({
    options,
    onChange,
  })

  return (
    <ul className='flex flex-col gap-3'>
      {options.map((opt, index) => (
        <li key={opt.id} className='group/option flex items-center gap-2'>
          <GripVertical className='text-muted-foreground/50 h-4 w-4 shrink-0' />
          <span className='text-muted-foreground w-5 text-sm leading-relaxed tabular-nums'>
            {index + 1}
          </span>
          <InlineEditable
            value={opt.label}
            onChange={(label) => updateOptionLabel(opt.id, label)}
            placeholder={`选项 ${index + 1}`}
            maxLength={LABEL_LIMITS.choiceOption}
            className='placeholder:text-muted-foreground/50 max-w-full min-w-0 flex-1 text-sm leading-relaxed font-normal'
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                insertOptionAfter(index, () => ({
                  id: createQuestionId(),
                  label: '',
                }))
              }
            }}
          />
        </li>
      ))}
    </ul>
  )
}
