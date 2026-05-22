import { useEffect, useState } from 'react'
import {
  type VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type TableState } from '@/types/table'
import { cn } from '@/lib/utils'
import { ColumnVisibility } from '@/components/column-visibility'
import { DataTable, DataTablePagination } from '@/components/data-table'
import { FilterMenu } from '@/components/filter-menu'
import { type Task } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { taskColumns as columns } from './task-columns'

type DataTableProps = {
  data: Task[]
  total: number
  isLoading?: boolean
  tableState: TableState
}

export function TaskTable({
  data,
  total,
  isLoading,
  tableState,
}: DataTableProps) {
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
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
