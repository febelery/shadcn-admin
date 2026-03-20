import { useEffect, useState, useMemo } from 'react'
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
import { type SurveyListItem } from '@/features/surveys/types'
import { surveysColumns as columns } from './surveys-columns'
import { useDeleteSurvey, useUpdateSurveyStatus } from '@/features/surveys/hooks/use-surveys'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

type DataTableProps = {
  data: SurveyListItem[]
  total: number
  isLoading?: boolean
  tableState: TableState
  onOpenBuilder: (id: string) => void
}

export function SurveysTable({
  data,
  total,
  isLoading,
  tableState,
  onOpenBuilder,
}: DataTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { mutate: deleteSurvey } = useDeleteSurvey()
  const { mutate: updateStatus } = useUpdateSurveyStatus()

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    ensurePageInRange,
  } = tableState

  const tableColumns = useMemo(
    () =>
      columns(
        onOpenBuilder,
        (params) => {
          updateStatus(params)
          toast.success('状态已更新')
        },
        setDeleteId
      ),
    [onOpenBuilder, updateStatus]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
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
      <div className="flex items-center justify-between">
        <FilterMenu
          table={table}
          mode="remote"
          onFiltersChange={onColumnFiltersChange}
          filters={tableState.filters}
          align="start"
        />
        <ColumnVisibility table={table} />
      </div>
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} className="mt-auto" />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该问卷及其所有回收数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteSurvey(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
