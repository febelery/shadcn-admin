import { useMemo } from 'react'
import {
  flexRender,
  type Row,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import { type DragEndEvent } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sortable,
  SortableContent,
  SortableItem,
} from '@/components/ui/sortable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData extends object & { id: string }> {
  table: TanstackTable<TData>
  onReorder?: (
    event: DragEndEvent & { activeIndex: number; overIndex: number }
  ) => void
  isLoading?: boolean
}

// 可拖拽行组件
function DraggableRow<TData extends object & { id: string }>({
  row,
}: {
  row: Row<TData>
}) {
  const rowId = row.original.id

  return (
    <SortableItem value={rowId} asChild>
      <TableRow
        data-state={row.getIsSelected() && 'selected'}
        className={cn(
          'group/row relative z-0',
          'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
        )}
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
    </SortableItem>
  )
}

export function DataTable<TData extends object & { id: string }>({
  table,
  onReorder,
  isLoading,
}: DataTableProps<TData>) {
  // 生成可拖拽项的数据列表
  const rows = table.getFilteredRowModel().rows
  const data = useMemo(() => rows.map((row) => row.original), [rows])

  const tableContent = (
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
        {isLoading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              {table.getVisibleFlatColumns().map((column) => (
                <TableCell key={column.id}>
                  <Skeleton className='h-6 w-full' />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows?.length ? (
          onReorder ? (
            <SortableContent withoutSlot>
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContent>
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
              没有数据
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  if (onReorder) {
    return (
      <div className='overflow-hidden rounded-md border'>
        {/* @ts-expect-error - TypeScript 无法正确推断条件类型，但运行时类型是正确的 */}
        <Sortable<TData>
          value={data}
          onMove={onReorder}
          orientation='vertical'
          getItemValue={(item: TData) => item.id}
        >
          {tableContent}
        </Sortable>
      </div>
    )
  }

  return <div className='overflow-hidden rounded-md border'>{tableContent}</div>
}
