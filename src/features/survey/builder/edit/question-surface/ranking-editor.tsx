import type { KeyboardEvent } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import type { ChoiceOption } from '../../../core/types'
import { BUILDER_TEXT_LIMITS } from '../../shared/text-limits'
import { InlineEditable } from '../inline-editable'
import { useChoiceOptions } from './use-choice-options'

type Props = {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}

/** 排序题画布：编辑并调整作答时的初始选项顺序。 */
export function SurfaceRankingEditor({ options, onChange }: Props) {
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
    (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        insertOptionAfter(index)
      }
      if (event.key === 'Backspace' && event.currentTarget.value === '') {
        if (options.length > 1) {
          event.preventDefault()
          removeOption(id)
          focusPreviousOption(index)
        }
      }
    }

  return (
    <Sortable
      value={options}
      onValueChange={onChange}
      getItemValue={(option) => option.id}
    >
      <SortableContent asChild>
        <ul className='flex flex-col gap-2'>
          {options.map((option, index) => (
            <SortableItem key={option.id} value={option.id} asChild>
              <li className='group/option grid grid-cols-[1.75rem_1.5rem_1fr_1.75rem] items-center gap-x-2'>
                <SortableItemHandle
                  className='text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded'
                  data-surface-chrome
                  aria-label={`拖动选项 ${index + 1}`}
                >
                  <GripVertical className='size-4' />
                </SortableItemHandle>
                <span className='text-muted-foreground text-sm leading-relaxed tabular-nums'>
                  {index + 1}
                </span>
                <InlineEditable
                  value={option.label}
                  onChange={(label) => updateOptionLabel(option.id, label)}
                  placeholder={`选项 ${index + 1}`}
                  maxLength={BUILDER_TEXT_LIMITS.choiceOption}
                  inputRef={(element) => setEditorRef(option.id, element)}
                  className='placeholder:text-muted-foreground/50 max-w-full min-w-0 text-sm leading-relaxed font-normal'
                  onKeyDown={handleOptionKeyDown(index, option.id)}
                />
                {options.length > 1 ? (
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-destructive flex size-7 items-center justify-center rounded opacity-0 group-hover/option:opacity-100'
                    data-surface-chrome
                    aria-label='删除选项'
                    onClick={() => removeOption(option.id)}
                  >
                    <Trash2 className='size-3.5' />
                  </button>
                ) : (
                  <span className='size-7' />
                )}
              </li>
            </SortableItem>
          ))}
          <li className='pl-[4.25rem]'>
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground py-0.5 text-sm leading-relaxed'
              data-surface-chrome
              onClick={() => insertAfterLast()}
            >
              + 添加选项
            </button>
          </li>
        </ul>
      </SortableContent>
      <SortableOverlay>
        <div className='bg-background text-foreground flex items-center gap-2 rounded-md border px-3 py-2 shadow-lg'>
          <GripVertical className='text-muted-foreground size-4' />
          <span className='text-xs leading-none'>调整选项顺序</span>
        </div>
      </SortableOverlay>
    </Sortable>
  )
}
