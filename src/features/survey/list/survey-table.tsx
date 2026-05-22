import { useEffect, useMemo, useState } from 'react'
import {
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import type { TableState } from '@/types/table'
import { ClipboardList, FilterX, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ColumnVisibility } from '@/components/column-visibility'
import { DataTable, DataTablePagination } from '@/components/data-table'
import { FilterMenu } from '@/components/filter-menu'
import type { SurveyListItem } from '../core/types'
import {
  useDeleteSurvey,
  usePublishSurvey,
  useUpdateSurveyStatus,
} from '../query/hooks'
import { createSurveyColumns } from './survey-columns'

type Props = {
  data: SurveyListItem[]
  total: number
  isLoading?: boolean
  tableState: TableState
  onCreate: () => void
}

export function SurveyTable({
  data,
  total,
  isLoading,
  tableState,
  onCreate,
}: Props) {
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

  const handleClearFilters = () => onColumnFiltersChange([])

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

  const hasActiveFilters = columnFilters.length > 0

  return (
    <div className='flex h-full flex-col gap-2'>
      <div
        role='toolbar'
        aria-orientation='horizontal'
        className='flex flex-wrap items-center justify-between gap-2'
      >
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <FilterMenu
            table={table}
            mode='remote'
            onFiltersChange={onColumnFiltersChange}
            filters={tableState.filters}
            align='start'
          />
          {hasActiveFilters && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-muted-foreground h-8 px-2'
              onClick={handleClearFilters}
            >
              <FilterX data-icon='inline-start' />
              清除筛选
            </Button>
          )}
        </div>
        <ColumnVisibility table={table} buttonLabel='列' align='end' />
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyState={
          <SurveyEmptyState
            filtered={hasActiveFilters}
            onCreate={onCreate}
            onClearFilters={handleClearFilters}
          />
        }
      />
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}

function SurveyEmptyState({
  filtered,
  onCreate,
  onClearFilters,
}: {
  filtered: boolean
  onCreate: () => void
  onClearFilters: () => void
}) {
  const Icon = filtered ? FilterX : ClipboardList

  return (
    <Empty className='border-0 py-10'>
      <EmptyHeader>
        <EmptyMedia variant='icon' className='text-muted-foreground'>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{filtered ? '没有匹配的问卷' : '暂无问卷'}</EmptyTitle>
        <EmptyDescription>
          {filtered
            ? '当前筛选条件下没有可显示的问卷。'
            : '创建第一份问卷后会在这里展示。'}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filtered ? (
          <Button variant='outline' size='sm' onClick={onClearFilters}>
            <FilterX data-icon='inline-start' />
            清除筛选
          </Button>
        ) : (
          <Button size='sm' onClick={onCreate}>
            <Plus data-icon='inline-start' />
            新建问卷
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
