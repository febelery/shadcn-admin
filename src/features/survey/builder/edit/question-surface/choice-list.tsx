import type { KeyboardEvent } from 'react'
import { Circle, Square, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChoiceOption, QuestionElement } from '../../../core/types'
import { BUILDER_TEXT_LIMITS } from '../../shared/text-limits'
import { InlineEditable } from '../inline-editable'
import { useChoiceOptions } from './use-choice-options'

type Props = {
  question: QuestionElement
  mode: 'single' | 'multiple'
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}

/** 单选 / 多选 — 画布选项列表 */
export function SurfaceChoiceList({
  question,
  mode,
  options,
  onChange,
}: Props) {
  const { optionLayout } = question.config

  const {
    setEditorRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLast,
    focusPreviousOption,
  } = useChoiceOptions({
    options,
    onChange,
  })

  const handleOptionKeyDown =
    (index: number, id: string) =>
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        insertOptionAfter(index)
      }
      if (e.key === 'Backspace' && e.currentTarget.value === '') {
        if (options.length > 1) {
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
    <ul className={cn('list-none', layoutClass)}>
      {options.map((opt, index) => (
        <li key={opt.id} className='group/option flex flex-col gap-1 py-0.5'>
          <div className='grid grid-cols-[1.25rem_1fr_1.75rem] items-center gap-x-3'>
            <Icon className='text-muted-foreground size-4.5 shrink-0 stroke-[1.5]' />
            <InlineEditable
              value={opt.label}
              onChange={(label) => updateOptionLabel(opt.id, label)}
              placeholder={`选项 ${index + 1}`}
              maxLength={BUILDER_TEXT_LIMITS.choiceOption}
              inputRef={(element) => setEditorRef(opt.id, element)}
              className='text-foreground placeholder:text-muted-foreground/50 min-w-0 text-sm leading-relaxed font-normal'
              onKeyDown={handleOptionKeyDown(index, opt.id)}
            />
            {options.length > 1 ? (
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
          className='text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-0.5 text-sm leading-relaxed'
          data-surface-chrome
          onClick={() => insertAfterLast()}
        >
          + 添加选项
        </button>
      </li>
    </ul>
  )
}
