import { useEffect, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QUESTION_TYPE_MAP } from '@/features/survey-builder/constants'
import { useOptionsManager } from '@/features/survey-builder/hooks/use-options-manager'
import {
  useBuilderStore,
  useVisibleNodeNumber,
} from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'
import { SortableInputRow } from '../panel/configs/sortable-input-row'
import { QuestionPreview } from './question-preview'

interface Props {
  node: QuestionNode
}

// 问卷题目卡片主组件
export function QuestionCard({ node }: Props) {
  const { selectedNodeId, selectNode, removeNode, duplicateNode, updateNode } =
    useBuilderStore()
  const numMap = useVisibleNodeNumber()
  const isSelected = selectedNodeId === node.id
  const num = numMap[node.id]

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const prevSelected = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const typeConfig = QUESTION_TYPE_MAP[node.type]
  const hasOptions = [
    'single_choice',
    'multiple_choice',
    'dropdown',
    'ranking',
    'image_choice',
  ].includes(node.type)

  useEffect(() => {
    if (isSelected) {
      // Autosize is now handled by the component itself,
      // but we might still need to trigger initial focus or something.
    }
  }, [isSelected])

  useEffect(() => {
    if (isSelected && !prevSelected.current) {
      setTimeout(() => titleRef.current?.focus(), 30)
    }
    prevSelected.current = isSelected
  }, [isSelected])

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'group border-border/25 bg-background relative border-b transition-all duration-100',
          // ✅ 选中态：用 primary token，不再硬编码蓝色
          isSelected
            ? 'bg-primary/3 shadow-[inset_2.5px_0_0_var(--color-primary)]'
            : 'hover:bg-muted/50 hover:border-border/60 hover:shadow-sm',
          isDragging && 'z-50 rotate-[0.3deg] opacity-50 shadow-lg'
        )}
        onClick={(e) => {
          e.stopPropagation()
          selectNode(node.id)
        }}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'text-border/40 absolute top-3.5 left-1.5 cursor-grab transition-all',
            'hover:text-muted-foreground opacity-0 group-hover:opacity-100',
            isSelected && 'opacity-50'
          )}
        >
          <GripVertical className='h-4 w-4' />
        </div>

        {/* 右上角操作栏 */}
        <div
          className={cn(
            'absolute top-0 right-0 z-10 flex overflow-hidden rounded-bl-lg',
            'border-border/30 bg-background/95 border-b border-l shadow-sm backdrop-blur-sm',
            'translate-y-0 opacity-0 transition-all duration-150',
            'group-hover:opacity-100',
            isSelected && 'opacity-100'
          )}
        >
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                className='border-border/25 text-muted-foreground/60 hover:bg-muted hover:text-foreground h-7 w-8 items-center justify-center rounded-none border-r transition'
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateNode(node.id)
                }}
              >
                <Copy className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制题目</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                className='text-muted-foreground/60 h-7 w-8 items-center justify-center rounded-none transition hover:bg-red-50 hover:text-red-500'
                onClick={(e) => {
                  e.stopPropagation()
                  removeNode(node.id)
                }}
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除题目</TooltipContent>
          </Tooltip>
        </div>

        {/* 内容区域 */}
        <div className='px-3 py-3 pr-20 pl-7'>
          {/* Meta row */}
          <div className='mb-2 flex items-center gap-1.5'>
            {num !== undefined && (
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  'h-4 w-4 shrink-0 rounded-sm p-0 font-mono text-[9px] font-bold shadow-none',
                  isSelected
                    ? 'bg-primary'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {String(num).padStart(2, '0')}
              </Badge>
            )}
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                // ✅ 类型标签用 primary token
                isSelected ? 'text-primary/70' : 'text-muted-foreground/50'
              )}
            >
              {typeConfig?.label}
            </span>
            {node.required && (
              <Badge
                variant='destructive'
                className='ml-auto border-none bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500 shadow-none hover:bg-red-50'
              >
                必填
              </Badge>
            )}
          </div>

          {/* Title */}
          {isSelected ? (
            <textarea
              ref={titleRef}
              className={cn(
                'placeholder:text-muted-foreground/30 w-full resize-none border-none bg-transparent ring-0 outline-none',
                'mb-1.5 field-sizing-content min-h-[1.5em] p-0 leading-relaxed',
                'text-foreground text-sm font-medium'
              )}
              value={node.title}
              placeholder='输入问题标题...'
              rows={1}
              onChange={(e) => updateNode(node.id, { title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          ) : (
            <div className='mb-2'>
              {node.required && (
                <span className='mr-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-red-500' />
              )}
              <span
                className={cn(
                  'text-sm leading-snug font-medium',
                  !node.title && 'text-muted-foreground/40 italic'
                )}
              >
                {node.title || '（未填写问题标题）'}
              </span>
            </div>
          )}

          {/* Description input */}
          {isSelected && (
            <input
              className='text-muted-foreground/70 placeholder:text-muted-foreground/30 mb-2.5 w-full rounded bg-transparent text-xs ring-0 outline-none focus:outline-none'
              value={node.description ?? ''}
              placeholder='添加描述说明（可选）...'
              onChange={(e) =>
                updateNode(node.id, { description: e.target.value })
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Question body */}
          {isSelected && hasOptions ? (
            <InlineOptionEditor node={node} />
          ) : (
            <QuestionPreview node={node} />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// 行内选项编辑器
function InlineOptionEditor({ node }: { node: QuestionNode }) {
  const options = node.config.options ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const { save, addOption, removeOption, updateLabel } = useOptionsManager(
    node.id,
    options
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = options.findIndex((o) => o.id === active.id)
    const newIdx = options.findIndex((o) => o.id === over.id)
    save(arrayMove(options, oldIdx, newIdx))
  }

  return (
    <div className='flex flex-col' onClick={(e) => e.stopPropagation()}>
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
            <SortableInputRow
              key={opt.id}
              id={opt.id}
              value={opt.label}
              placeholder={`选项 ${i + 1}`}
              onChange={(label) => updateLabel(opt.id, label)}
              onDelete={() => removeOption(opt.id)}
              onEnter={() => addOption(i)}
              onBackspaceEmpty={() => {
                if (options.length > 1) {
                  const prevId = i > 0 ? options[i - 1].id : options[1]?.id
                  removeOption(opt.id)
                  if (prevId) {
                    setTimeout(() => {
                      const el = document.querySelector<HTMLInputElement>(
                        `[data-opt-id="${prevId}"]`
                      )
                      el?.focus()
                    }, 30)
                  }
                }
              }}
              className='border-none px-0 py-0.5'
              showGrip={false}
              prefix={
                <span
                  className={cn(
                    'border-muted-foreground/25 bg-background mt-1.5 h-3.5 w-3.5 shrink-0 border-2 transition-colors',
                    node.type === 'single_choice'
                      ? 'rounded-full'
                      : 'rounded-[3px]'
                  )}
                />
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant='ghost'
        size='sm'
        onClick={() => addOption(options.length - 1)}
        className='text-muted-foreground/40 hover:bg-muted/40 hover:text-primary mt-1 h-7 gap-1.5 rounded px-1.5 text-[11px] font-medium transition'
      >
        <Plus className='h-3 w-3' />
        添加选项
      </Button>
    </div>
  )
}
