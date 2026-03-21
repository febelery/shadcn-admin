import { useEffect, useMemo } from 'react'
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
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'
import { SortableInputRow } from './sortable-input-row'

type MatrixItem = { id: string; label: string }

// ── Manage list component
function ItemList({
  title,
  items,
  onUpdate,
  placeholder,
  addLabel,
}: {
  title: string
  items: MatrixItem[]
  onUpdate: (items: MatrixItem[]) => void
  placeholder: string
  addLabel: string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex((i) => i.id === active.id)
    const newIdx = items.findIndex((i) => i.id === over.id)
    onUpdate(arrayMove(items, oldIdx, newIdx))
  }

  const updateLabel = (id: string, label: string) =>
    onUpdate(items.map((i) => (i.id === id ? { ...i, label } : i)))

  const addItem = () =>
    onUpdate([...items, { id: crypto.randomUUID(), label: '' }])

  const removeItem = (id: string) => {
    if (items.length <= 1) return
    onUpdate(items.filter((i) => i.id !== id))
  }

  return (
    <div className='mb-3'>
      {/* Sub-header */}
      <div className='bg-muted/20 flex items-center justify-between px-3 py-1.5'>
        <span className='text-muted-foreground/70 text-[10px] font-semibold'>
          {title}
        </span>
        <Badge
          variant='secondary'
          className='text-muted-foreground bg-secondary h-4 rounded px-1.5 font-mono text-[10px]'
        >
          {items.length}
        </Badge>
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableInputRow
              key={item.id}
              id={item.id}
              value={item.label}
              placeholder={placeholder}
              onChange={(label) => updateLabel(item.id, label)}
              onDelete={() => removeItem(item.id)}
              onEnter={addItem}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add button */}
      <button
        onClick={addItem}
        className='border-border/30 text-muted-foreground hover:bg-muted/30 hover:text-foreground flex w-full items-center gap-2 border-t px-3 py-2 text-xs font-medium transition-colors'
      >
        <Plus className='h-3.5 w-3.5' />
        {addLabel}
      </button>
    </div>
  )
}

// ── Matrix Config
export function MatrixConfig({ node }: { node: QuestionNode }) {
  const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)

  const rows = useMemo<MatrixItem[]>(() => {
    if (node.config.rows && node.config.rows.length > 0) return node.config.rows
    return [{ id: crypto.randomUUID(), label: '行 1' }]
  }, [node.config.rows])

  const columns = useMemo<MatrixItem[]>(() => {
    if (node.config.columns && node.config.columns.length > 0)
      return node.config.columns
    return [{ id: crypto.randomUUID(), label: '列 1' }]
  }, [node.config.columns])

  // Initialize if empty (in useEffect to avoid render-time side effects)
  useEffect(() => {
    if (!node.config.rows?.length || !node.config.columns?.length) {
      updateNodeConfig(node.id, { rows, columns })
    }
  }, [
    node.id,
    node.config.rows?.length,
    node.config.columns?.length,
    updateNodeConfig,
    rows,
    columns,
  ])

  return (
    <div>
      {/* Preview info */}
      <div className='bg-muted/30 text-muted-foreground border-border/30 mx-3 mb-3 rounded-md border px-3 py-2 text-center text-[11px]'>
        {rows.length} 行 × {columns.length} 列
        {node.type === 'matrix_multiple' ? ' （多选）' : ' （单选）'}
      </div>

      <ItemList
        title='行标签'
        items={rows}
        onUpdate={(items) => updateNodeConfig(node.id, { rows: items })}
        placeholder='行标签...'
        addLabel='添加行'
      />

      <ItemList
        title='列标签'
        items={columns}
        onUpdate={(items) => updateNodeConfig(node.id, { columns: items })}
        placeholder='列标签...'
        addLabel='添加列'
      />
    </div>
  )
}
