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
import { Button } from '@/components/ui/button'
import { useOptionsManager } from '@/features/survey-builder/hooks/use-options-manager'
import type { QuestionNode } from '@/features/survey-builder/types'
import { SortableInputRow } from '../panel/configs/sortable-input-row'

export function InlineRankingEditor({ node }: { node: QuestionNode }) {
  const options = node.config.options ?? []
  const { save, addOption, removeOption, updateLabel } = useOptionsManager(
    node.id,
    options
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = options.findIndex((o) => o.id === active.id)
    const newIdx = options.findIndex((o) => o.id === over.id)
    save(arrayMove(options, oldIdx, newIdx))
  }

  return (
    <div className='flex flex-col gap-3' onClick={(e) => e.stopPropagation()}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='flex flex-col gap-2'>
            {options.map((opt, i) => (
              <div
                key={opt.id}
                className='group/ranking flex items-center gap-2'
              >
                <div className='border-border/40 bg-muted/20 text-muted-foreground/40 flex size-8 items-center justify-center rounded-lg border font-mono text-xs font-bold'>
                  {i + 1}
                </div>
                <div className='flex-1'>
                  <SortableInputRow
                    id={opt.id}
                    value={opt.label}
                    placeholder={`排序项 ${i + 1}`}
                    onChange={(label) => updateLabel(opt.id, label)}
                    onDelete={() => removeOption(opt.id)}
                    onEnter={() => addOption(i)}
                    className='border-none px-0 py-0'
                    showGrip={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant='ghost'
        size='sm'
        onClick={() => addOption(options.length - 1)}
        className='text-muted-foreground/30 hover:bg-muted/40 hover:text-primary h-8 w-fit gap-1.5 rounded-lg px-3 text-xs font-bold tracking-widest uppercase transition'
      >
        <Plus className='size-3.5' />
        添加排序项
      </Button>
    </div>
  )
}
