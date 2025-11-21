import { useId, useMemo } from 'react'
import {
  flexRender,
  type Row,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData> {
  table: TanstackTable<TData>
  onReorder?: (event: DragEndEvent) => void
}

// 可拖拽行组件
function DraggableRow<TData>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: (row.original as { id: string }).id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={cn(
        'group/row relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
            cell.column.columnDef.meta?.className,
            cell.column.columnDef.meta?.tdClassName
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable<TData>({ table, onReorder }: DataTableProps<TData>) {
  const sortableId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // 生成可拖拽项的 ID 列表
  const rows = table.getFilteredRowModel().rows
  const dataIds = useMemo<UniqueIdentifier[]>(
    () => rows.map((row) => (row.original as { id: string }).id),
    [rows]
  )

  const content = (
    <Table>
      <TableHeader className='bg-muted sticky top-0 z-10'>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className='group/row'>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={cn(
                    'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                    header.column.columnDef.meta?.className,
                    header.column.columnDef.meta?.thClassName
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className='**:data-[slot=table-cell]:first:w-8'>
        {table.getRowModel().rows?.length ? (
          onReorder ? (
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className='group/row'
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                      cell.column.columnDef.meta?.className,
                      cell.column.columnDef.meta?.tdClassName
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className='h-24 text-center'
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  if (onReorder) {
    return (
      <div className='overflow-hidden rounded-md border'>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onReorder}
          sensors={sensors}
          id={sortableId}
        >
          {content}
        </DndContext>
      </div>
    )
  }

  return <div className='overflow-hidden rounded-md border'>{content}</div>
}
