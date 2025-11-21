import { useEffect, useState } from 'react'
import {
  type VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type TableState } from '@/types/table'
import { cn } from '@/lib/utils'
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import { priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { tasksColumns as columns } from './tasks-columns'

type DataTableProps = {
  data: Task[]
  total: number
  isLoading?: boolean
  tableState: TableState
}

export function TasksTable({
  data,
  total,
  isLoading,
  tableState,
}: DataTableProps) {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // 从父组件接收表格状态
  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    ensurePageInRange,
  } = tableState

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      sorting: sorting || [],
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
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
    onGlobalFilterChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(total)
  }, [total, ensurePageInRange])

  return (
    <div className={cn('flex h-full flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter tasks...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: statuses,
          },
          {
            columnId: 'priority',
            title: 'Priority',
            options: priorities,
          },
        ]}
      />
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
