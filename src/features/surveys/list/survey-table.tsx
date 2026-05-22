import { useEffect, useMemo, useState } from 'react'
import {
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import type { TableState } from '@/types/table'
import { DataTable, DataTablePagination } from '@/components/data-table'
import { FilterMenu } from '@/components/filter-menu'
import type { SurveyListItem } from '../core/types'
import {
  useDeleteSurvey,
  usePublishSurvey,
  useUpdateSurveyStatus,
} from '../queries/hooks'
import { createSurveyColumns } from './survey-columns'

type Props = {
  data: SurveyListItem[]
  total: number
  isLoading?: boolean
  tableState: TableState
}

export function SurveyTable({ data, total, isLoading, tableState }: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { mutate: deleteSurvey } = useDeleteSurvey()
  const { mutate: publishSurvey } = usePublishSurvey()
  const { mutate: updateSurveyStatus } = useUpdateSurveyStatus()

  const columns = useMemo(
    () =>
      createSurveyColumns({
        onDelete: deleteSurvey,
        onPublish: publishSurvey,
        onPause: (id) => updateSurveyStatus({ id, status: 'draft' }),
      }),
    [deleteSurvey, publishSurvey, updateSurveyStatus]
  )

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
    pageCount: Math.ceil(total / pagination.pageSize) || 1,
    state: {
      sorting: sorting || [],
      columnVisibility,
      columnFilters,
      pagination,
    },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(Math.ceil(total / pagination.pageSize) || 1)
  }, [total, pagination.pageSize, ensurePageInRange])

  return (
    <div className='flex flex-col gap-4'>
      <FilterMenu
        table={table}
        mode='remote'
        onFiltersChange={onColumnFiltersChange}
        filters={tableState.filters}
      />
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} />
    </div>
  )
}
