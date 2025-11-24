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
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import { roles } from '../data/data'
import { type User } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { usersColumns as columns } from './users-columns'

type DataTableProps = {
  data: User[]
  total: number
  isLoading?: boolean
  tableState: TableState
}

export function UsersTable({
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

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // 从父组件接收表格状态
  const {
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

  const handleDragEnd = (event: DragEndEvent & { activeIndex: number; overIndex: number }) => {
    const { activeIndex, overIndex } = event
    setData((prevData) => arrayMove(prevData, activeIndex, overIndex))
    // Log the drag event details
    console.log('Drag ended:', {
      activeIndex,
      overIndex,
      data,
    })
  }

  return (
    <div className={cn('flex h-full flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter users...'
        searchKey='username'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Invited', value: 'invited' },
              { label: 'Suspended', value: 'suspended' },
            ],
          },
          {
            columnId: 'role',
            title: 'Role',
            options: roles.map((role) => ({ ...role })),
          },
        ]}
      />
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
