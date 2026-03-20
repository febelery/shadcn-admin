'use client'
import { useState, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Image, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBuilderStore } from '@/features/survey-builder/store'
import type {
  ChoiceOption,
  QuestionNode,
} from '@/features/survey-builder/types'

// 单个可排序选项行
function OptionRow({
  opt,
  index,
  showImage,
  isRanking,
  onChange,
  onImageChange,
  onDelete,
  focusedId,
  setFocusedId,
  onEnter,
  onBackspaceEmpty,
}: {
  opt: ChoiceOption
  index: number
  showImage: boolean
  isRanking: boolean
  onChange: (label: string) => void
  onImageChange?: (url: string) => void
  onDelete: () => void
  focusedId: string | null
  setFocusedId: (id: string | null) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opt.id })

  const inputRef = useRef<HTMLInputElement>(null)
  const isFocused = focusedId === opt.id

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group border-border/40 flex items-start gap-1.5 border-b px-2 py-1 last:border-0',
        isDragging && 'bg-muted/60 rounded shadow-sm',
        isFocused && 'bg-muted/30'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className='text-border/50 hover:text-muted-foreground mt-1.5 shrink-0 cursor-grab transition-colors active:cursor-grabbing'
      >
        <GripVertical className='h-3 w-3' />
      </button>

      {/* Index */}
      {isRanking && (
        <span className='text-muted-foreground/50 mt-1.5 w-4 shrink-0 text-center font-mono text-[10px] font-bold'>
          {index + 1}
        </span>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        {/* Label input */}
        <Input
          ref={inputRef}
          className='placeholder:text-muted-foreground/30 h-7 border-0 bg-transparent px-0 text-xs shadow-none ring-0 focus-visible:ring-0'
          value={opt.label}
          placeholder={`选项 ${index + 1}`}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedId(opt.id)}
          onBlur={() => setFocusedId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter()
            }
            if (e.key === 'Backspace' && !opt.label) {
              e.preventDefault()
              onBackspaceEmpty()
            }
          }}
        />

        {/* Image URL input */}
        {showImage && (
          <div className='flex items-center gap-1'>
            <Image className='text-muted-foreground/40 h-3 w-3 shrink-0' />
            <Input
              className='placeholder:text-muted-foreground/25 h-6 border-0 bg-transparent px-0 text-[10px] shadow-none ring-0 focus-visible:ring-0'
              value={(opt as any).image ?? ''}
              placeholder='图片 URL...'
              onChange={(e) => onImageChange?.(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        tabIndex={-1}
        className='text-border/30 hover:text-destructive mt-1.5 shrink-0 opacity-0 transition-all group-hover:opacity-100'
        onClick={onDelete}
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  )
}

// 选项配置主组件
export function ChoiceConfig({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const options: ChoiceOption[] = node.config.options ?? []
  const isRanking = node.type === 'ranking'
  const isImage = node.type === 'image_choice'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const save = (opts: ChoiceOption[]) =>
    updateNodeConfig(node.id, {
      options: opts.map((o, i) => ({ ...o, order: i })),
    })

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = options.findIndex((o) => o.id === active.id)
    const newIdx = options.findIndex((o) => o.id === over.id)
    save(arrayMove(options, oldIdx, newIdx))
  }

  const updateLabel = (id: string, label: string) =>
    save(
      options.map((o) =>
        o.id === id
          ? {
              ...o,
              label,
              value: label.toLowerCase().replace(/\s+/g, '_') || o.value,
            }
          : o
      )
    )

  const updateImage = (id: string, image: string) =>
    save(options.map((o) => (o.id === id ? { ...o, image } : o)))

  const addOption = (afterIndex?: number) => {
    const newId = crypto.randomUUID()
    const newOpt: ChoiceOption = {
      id: newId,
      label: '',
      value: `opt_${newId.slice(0, 8)}`,
      order: options.length,
    }
    const idx = afterIndex !== undefined ? afterIndex + 1 : options.length
    const updated = [...options.slice(0, idx), newOpt, ...options.slice(idx)]
    save(updated)
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        `[data-opt-id="${newId}"]`
      )
      el?.focus()
    }, 30)
  }

  const removeOption = (id: string) => {
    if (options.length <= 1) return
    const idx = options.findIndex((o) => o.id === id)
    const prevId = options[idx - 1]?.id ?? options[idx + 1]?.id
    save(options.filter((o) => o.id !== id))
    if (prevId) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(
          `[data-opt-id="${prevId}"]`
        )
        el?.focus()
      }, 30)
    }
  }

  return (
    <div>
      {/* Option list header */}
      <div className='flex items-center justify-between px-3 py-1.5'>
        <span className='text-muted-foreground/60 text-[10px] font-semibold'>
          {isRanking ? '排列项' : '选项列表'}
        </span>
        <Badge
          variant='secondary'
          className='text-muted-foreground bg-secondary h-4 rounded px-1.5 font-mono text-[10px]'
        >
          {options.length}
        </Badge>
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              opt={opt}
              index={i}
              showImage={isImage}
              isRanking={isRanking}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onChange={(label) => updateLabel(opt.id, label)}
              onImageChange={
                isImage ? (url) => updateImage(opt.id, url) : undefined
              }
              onDelete={() => removeOption(opt.id)}
              onEnter={() => addOption(i)}
              onBackspaceEmpty={() => removeOption(opt.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add option */}
      <Button
        variant='ghost'
        onClick={() => addOption()}
        className='border-border/40 text-muted-foreground hover:bg-muted/30 hover:text-foreground h-11 w-full gap-2 rounded-none border-t px-3 py-2.5 text-xs font-medium transition-colors'
      >
        <Plus className='h-3.5 w-3.5' />
        {isRanking ? '添加选项' : '添加选项'}
        <Badge
          variant='secondary'
          className='text-muted-foreground bg-secondary ml-auto h-4 rounded px-1.5 font-mono text-[10px]'
        >
          {options.length}
        </Badge>
      </Button>

      {/* Behavior toggles */}
      {!isRanking && !isImage && (
        <div className='border-border/40 border-t'>
          <div className='px-3 py-1.5'>
            <span className='text-muted-foreground/60 text-[10px] font-semibold'>
              选项行为
            </span>
          </div>
          {(
            [
              {
                key: 'allowOther',
                label: '允许"其他"',
                desc: '追加自由输入项',
              },
              {
                key: 'randomOrder',
                label: '随机排序',
                desc: '每次展示打乱顺序',
              },
            ] as const
          ).map(({ key, label, desc }) => (
            <div
              key={key}
              className='border-border/30 flex items-center justify-between gap-3 border-t px-3 py-2'
            >
              <div>
                <p className='text-foreground text-xs font-medium'>{label}</p>
                <p className='text-muted-foreground text-[10px]'>{desc}</p>
              </div>
              <Switch
                checked={!!(node.config as any)[key]}
                onCheckedChange={(v) => updateNodeConfig(node.id, { [key]: v })}
                className='shrink-0'
              />
            </div>
          ))}
        </div>
      )}

      {/* Min/Max selection for multiple choice */}
      {node.type === 'multiple_choice' && (
        <div className='border-border/40 border-t px-3 py-2'>
          <span className='text-muted-foreground/60 mb-2 block text-[10px] font-semibold'>
            选择限制
          </span>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <label className='text-muted-foreground text-[10px]'>
                最少选
              </label>
              <Input
                type='number'
                min={0}
                className='h-7 text-xs'
                value={(node.config as any).minSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    minSelect: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </div>
            <div className='space-y-1'>
              <label className='text-muted-foreground text-[10px]'>
                最多选
              </label>
              <Input
                type='number'
                min={1}
                className='h-7 text-xs'
                value={(node.config as any).maxSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    maxSelect: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
