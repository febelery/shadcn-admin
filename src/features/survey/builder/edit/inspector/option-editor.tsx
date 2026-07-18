import { useRef, useState } from 'react'
import { GripVertical, ListPlus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import { Textarea } from '@/components/ui/textarea'
import type { ChoiceOption } from '../../../core/types'
import {
  OPTION_LINE_PRESETS,
  optionsToLines,
  parseOptionLines,
  sliceLinesForAppend,
} from '../../shared/parse-option-lines'
import { BUILDER_TEXT_LIMITS } from '../../shared/text-limits'

type Props = {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
  label?: string
  labelMaxLength?: number
  /** 是否展示批量录入（矩阵行/列、选项等列表均适用） */
  enableBatch?: boolean
}

export function OptionEditor({
  options,
  onChange,
  label = '选项',
  labelMaxLength = BUILDER_TEXT_LIMITS.choiceOption,
  enableBatch = true,
}: Props) {
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchText, setBatchText] = useState('')
  /** 打开批量区时的快照，用于「追加」只解析新增行 */
  const batchBaselineRef = useRef('')

  const parseOpts = { labelMaxLength }

  const toggleBatch = () => {
    if (batchOpen) {
      setBatchOpen(false)
      return
    }
    const snapshot = optionsToLines(options)
    batchBaselineRef.current = snapshot
    setBatchText(snapshot)
    setBatchOpen(true)
  }

  const applyBatch = (mode: 'replace' | 'append') => {
    const text =
      mode === 'append'
        ? sliceLinesForAppend(batchText, batchBaselineRef.current)
        : batchText

    const parsed = parseOptionLines(text, {
      ...parseOpts,
      startIndex: mode === 'append' ? options.length : 0,
    })
    if (parsed.length === 0) return

    if (mode === 'replace') {
      onChange(parsed)
    } else {
      onChange([...options, ...parsed])
    }
    setBatchText('')
    setBatchOpen(false)
  }

  const applyPreset = (lines: string) => {
    setBatchText(lines)
    batchBaselineRef.current = ''
  }

  return (
    <div className={cn('max-w-full min-w-0 overflow-hidden', 'gap-3')}>
      <div className='flex items-center justify-between gap-2'>
        <Label className='text-muted-foreground text-xs font-medium'>
          {label}
        </Label>
        <div className='flex shrink-0 items-center gap-0.5'>
          {enableBatch ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn(
                'text-muted-foreground h-7 px-2',
                'text-xs leading-none'
              )}
              onClick={toggleBatch}
            >
              <ListPlus className='mr-1 h-3 w-3' />
              批量
            </Button>
          ) : null}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className={cn('h-7', 'text-xs leading-none')}
            onClick={() =>
              onChange([
                ...options,
                {
                  id: crypto.randomUUID(),
                  label: `${label} ${options.length + 1}`,
                },
              ])
            }
          >
            <Plus className='mr-1 h-3 w-3' />
            添加
          </Button>
        </div>
      </div>

      {enableBatch ? (
        <Collapsible open={batchOpen} onOpenChange={setBatchOpen}>
          <CollapsibleContent className='bg-muted/30 flex flex-col gap-2 rounded-md border p-2.5'>
            <Textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder='每行一项'
              rows={5}
              className={cn('min-h-0 resize-y', 'text-xs leading-none')}
            />
            <div className='flex flex-wrap gap-1.5'>
              <Button
                type='button'
                size='sm'
                className={cn('h-7', 'text-xs leading-none')}
                disabled={!batchText.trim()}
                onClick={() => applyBatch('replace')}
              >
                应用修改
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className={cn('h-7', 'text-xs leading-none')}
                disabled={!batchText.trim()}
                onClick={() => applyBatch('append')}
              >
                追加
              </Button>
            </div>
            <div className='flex flex-wrap gap-1'>
              <span
                className={cn(
                  'text-muted-foreground text-xs leading-relaxed',
                  'w-full'
                )}
              >
                快捷模板（填入文本框）：
              </span>
              <PresetChip
                label='是/否'
                onClick={() => applyPreset(OPTION_LINE_PRESETS.yesNo)}
              />
              <PresetChip
                label='男/女/其他'
                onClick={() => applyPreset(OPTION_LINE_PRESETS.gender)}
              />
              <PresetChip
                label='满意度五档'
                onClick={() => applyPreset(OPTION_LINE_PRESETS.satisfaction5)}
              />
              <PresetChip
                label='频率五档'
                onClick={() => applyPreset(OPTION_LINE_PRESETS.frequency5)}
              />
            </div>
            <p className='text-muted-foreground text-xs leading-relaxed'>
              打开时会载入当前列表；应用修改保存全部行。追加仅在文末新增行时生效。
            </p>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <Sortable
        value={options}
        onValueChange={onChange}
        getItemValue={(o) => o.id}
      >
        <SortableContent className={cn('max-w-full min-w-0', 'gap-1.5')}>
          {options.map((opt, idx) => (
            <SortableItem
              key={opt.id}
              value={opt.id}
              className='border-border bg-muted/30 flex w-full max-w-full min-w-0 flex-col gap-1 overflow-hidden rounded-lg border px-1 py-1'
            >
              <div className='flex max-w-full min-w-0 items-center gap-1 overflow-hidden'>
                <SortableItemHandle className='text-muted-foreground hover:bg-muted flex h-7 w-6 shrink-0 items-center justify-center rounded'>
                  <GripVertical className='h-3.5 w-3.5' />
                </SortableItemHandle>
                <Input
                  className={cn(
                    'h-8 w-0 min-w-0 flex-1 overflow-hidden border-0 bg-transparent text-ellipsis shadow-none focus-visible:ring-0',
                    'text-xs leading-none'
                  )}
                  value={opt.label}
                  placeholder={`${label} ${idx + 1}`}
                  maxLength={labelMaxLength}
                  title={opt.label}
                  onChange={(e) => {
                    const next = options.map((o) =>
                      o.id === opt.id ? { ...o, label: e.target.value } : o
                    )
                    onChange(next)
                  }}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 shrink-0'
                  disabled={options.length <= 1}
                  onClick={() =>
                    onChange(options.filter((o) => o.id !== opt.id))
                  }
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </div>
            </SortableItem>
          ))}
        </SortableContent>
        <SortableOverlay>
          <div className='bg-background flex items-center gap-1 rounded-md border px-2 py-1 shadow-lg'>
            <GripVertical className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-xs leading-none'>拖动中…</span>
          </div>
        </SortableOverlay>
      </Sortable>
    </div>
  )
}

function PresetChip({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      className={cn(
        'text-xs leading-none',
        'bg-background hover:bg-muted rounded-md border px-2 py-0.5 transition-colors'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
