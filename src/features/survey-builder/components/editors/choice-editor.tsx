'use client'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOptionsManager } from '@/features/survey-builder/hooks/use-options-manager'
import type { QuestionNode } from '@/features/survey-builder/types'
import { SortableInputRow } from '../panel/configs/sortable-input-row'

export function InlineOptionEditor({ node }: { node: QuestionNode }) {
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
              className='border-none px-0 py-0'
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
