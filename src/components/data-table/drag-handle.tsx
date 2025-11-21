import { useSortable } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 拖拽手柄组件
 * 用于表格行的拖拽排序功能
 * Source: @dnd-kit/sortable
 */
export function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant='ghost'
      size='icon'
      className='text-muted-foreground size-7 cursor-grab hover:bg-transparent active:cursor-grabbing'
    >
      <GripVertical className='text-muted-foreground size-4' />
      <span className='sr-only'>Drag to reorder</span>
    </Button>
  )
}
