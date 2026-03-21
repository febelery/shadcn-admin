'use client'
import { useState } from 'react'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Image as ImageIcon, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useOptionsManager } from '@/features/survey-builder/hooks/use-options-manager'
import { useBuilderStore } from '@/features/survey-builder/store'
import type {
  ChoiceOption,
  QuestionNode,
} from '@/features/survey-builder/types'
import { SortableInputRow } from './sortable-input-row'

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
  const isFocused = focusedId === opt.id

  return (
    <SortableInputRow
      id={opt.id}
      value={opt.label}
      onChange={onChange}
      onDelete={onDelete}
      onEnter={onEnter}
      onBackspaceEmpty={onBackspaceEmpty}
      onFocus={() => setFocusedId(opt.id)}
      onBlur={() => setFocusedId(null)}
      placeholder={`选项 ${index + 1}`}
      isFocused={isFocused}
      prefix={
        isRanking && (
          <span className='text-muted-foreground/50 mt-1.5 w-4 shrink-0 text-center font-mono text-[10px] font-bold'>
            {index + 1}
          </span>
        )
      }
      extraFields={
        showImage && (
          <div className='flex items-center gap-1'>
            <ImageIcon className='text-muted-foreground/40 h-3 w-3 shrink-0' />
            <Input
              className='placeholder:text-muted-foreground/25 h-6 border-0 bg-transparent px-0 text-[10px] shadow-none ring-0 focus-visible:ring-0'
              value={(opt as any).image ?? ''}
              placeholder='图片 URL...'
              onChange={(e) => onImageChange?.(e.target.value)}
            />
          </div>
        )
      }
    />
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

  const { save, addOption, removeOption, updateLabel, updateImage } =
    useOptionsManager(node.id, options)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = options.findIndex((o) => o.id === active.id)
    const newIdx = options.findIndex((o) => o.id === over.id)
    save(arrayMove(options, oldIdx, newIdx))
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
        onClick={() => addOption(options.length - 1)}
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
