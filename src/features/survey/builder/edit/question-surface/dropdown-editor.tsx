import type { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ChoiceOption, QuestionElement } from '../../../core/types'
import { BUILDER_TEXT_LIMITS } from '../../shared/text-limits'
import { InlineEditable } from '../inline-editable'
import { useChoiceOptions } from './use-choice-options'

type Props = {
  question: QuestionElement
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}

/** 下拉题画布：Select 预览 + 无单选图标的选项列表 */
export function SurfaceDropdownEditor({ question, options, onChange }: Props) {
  const placeholder = question.config.placeholder ?? '请选择'
  const {
    setEditorRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLast,
    focusPreviousOption,
  } = useChoiceOptions({ options, onChange })

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

  return (
    <div className='flex flex-col gap-3'>
      <Select disabled>
        <SelectTrigger className='pointer-events-none w-full max-w-sm'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: ChoiceOption) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ul className='flex flex-col gap-2'>
        {options.map((opt: ChoiceOption, index: number) => (
          <li
            key={opt.id}
            className='group/option grid grid-cols-[1fr_1.75rem] items-center gap-x-2'
          >
            <InlineEditable
              value={opt.label}
              onChange={(label) => updateOptionLabel(opt.id, label)}
              placeholder={`选项 ${index + 1}`}
              maxLength={BUILDER_TEXT_LIMITS.choiceOption}
              inputRef={(element) => setEditorRef(opt.id, element)}
              className={cn(
                'text-foreground border-border/60 min-w-0 rounded-md border border-dashed px-2 py-1',
                'placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
              )}
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
          </li>
        ))}
        <li>
          <button
            type='button'
            className={cn(
              'text-sm leading-relaxed',
              'text-muted-foreground hover:text-foreground flex items-center gap-1.5'
            )}
            data-surface-chrome
            onClick={() => insertAfterLast()}
          >
            + 添加选项
          </button>
        </li>
      </ul>
    </div>
  )
}
