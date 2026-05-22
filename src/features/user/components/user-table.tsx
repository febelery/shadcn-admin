import { useEffect, useState } from 'react'
import {
  type VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type TableState } from '@/types/table'
import { type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { ColumnVisibility } from '@/components/column-visibility'
import { DataTable, DataTablePagination } from '@/components/data-table'
import { FilterMenu } from '@/components/filter-menu'
import { type User } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { userColumns as columns } from './user-columns'

type DataTableProps = {
  data: User[]
  total: number
  isLoading?: boolean
  tableState: TableState
}

export function UserTable({
  data: initialData,
  total,
  isLoading,
  tableState,
}: DataTableProps) {
  // 本地数据状态，用于拖拽排序
  const [data, setData] = useState(() => initialData)

  // 当初始数据变化时更新本地数据
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    ensurePageInRange,
  } = tableState

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      sorting: sorting || [],
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(total)
  }, [total, ensurePageInRange])

  const handleDragEnd = (
    event: DragEndEvent & { activeIndex: number; overIndex: number }
  ) => {
    const { activeIndex, overIndex } = event
    setData((prevData) => arrayMove(prevData, activeIndex, overIndex))
  }

  return (
    <div className={cn('flex h-full flex-col gap-4')}>
      <div className='flex items-center justify-between'>
        <FilterMenu
          table={table}
          mode='remote'
          onFiltersChange={onColumnFiltersChange}
          filters={tableState.filters}
          align='start'
        />
        <ColumnVisibility table={table} />
      </div>

      <DataTable
        table={table}
        onReorder={handleDragEnd}
        isLoading={isLoading}
      />
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
