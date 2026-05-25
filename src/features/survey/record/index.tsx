import { useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BarChart3, Download } from 'lucide-react'
import { useDataGrid } from '@/hooks/use-data-grid'
import { useTableState } from '@/hooks/use-table-state'
import { useWindowSize } from '@/hooks/use-window-size'
import { Button } from '@/components/ui/button'
import { ColumnVisibility } from '@/components/column-visibility'
import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridPagination } from '@/components/data-grid/data-grid-pagination'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { FilterMenu, type FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { flattenQuestions } from '../core/schema-defaults'
import {
  useExportSurveyRecordExcel,
  useSurveyDetail,
  useSurveyRecord,
} from '../query/hooks'
import { createRecordGridColumns } from './columns'

type SurveyRecordPageProps = {
  surveyId: string
}

const RECORD_GRID_PAGE_SIZE = 100
const recordFilterConfigs: FilterConfig[] = [
  {
    columnId: 'respondent',
    title: '填写人',
  },
  {
    columnId: 'status',
    title: '状态',
    options: [
      { label: '已完成', value: 'complete' },
      { label: '填写中', value: 'partial' },
    ],
    allowedOperators: ['is', 'isNot'],
  },
  {
    columnId: 'startedAt',
    title: '开始时间',
  },
  {
    columnId: 'completedAt',
    title: '提交时间',
  },
]

export function SurveyRecordPage({ surveyId }: SurveyRecordPageProps) {
  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: RECORD_GRID_PAGE_SIZE },
    sorting: { enabled: true },
  })
  const {
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    ensurePageInRange,
  } = tableState
  const params = {
    ...tableState.getQueryParams(),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  }

  const { data: schema } = useSurveyDetail(surveyId)
  const { data } = useSurveyRecord(surveyId, params)
  const { mutate: exportExcel, isPending: exporting } =
    useExportSurveyRecordExcel()

  const questions = useMemo(
    () => (schema ? flattenQuestions(schema) : []),
    [schema]
  )
  const columns = useMemo(() => createRecordGridColumns(questions, schema), [questions, schema])

  const { table, ...dataGridProps } = useDataGrid({
    data: data?.data ?? [],
    columns,
    pageCount: data?.meta?.totalPages ?? 1,
    onDataChange: () => {},
    getRowId: (row) => row.id,
    enableSearch: true,
    manualPagination: true,
    onPaginationChange,
    manualSorting: true,
    onSortingChange,
    readOnly: true,
    rowHeight: 'medium',
    state: {
      pagination,
      sorting: sorting || [],
    },
    initialState: {
      columnPinning: {
        left: ['respondent'],
      },
    },
  })

  useEffect(() => {
    ensurePageInRange(data?.meta?.totalPages ?? 1, { resetTo: 'last' })
  }, [data?.meta?.totalPages, ensurePageInRange])

  const windowSize = useWindowSize({ defaultHeight: 760 })
  const height = Math.max(420, windowSize.height - 230)

  return (
    <PageLayout
      variant='fixed'
      title={schema ? `${schema.meta.title} · 填写记录` : '填写记录'}
      description={`按题目列查看每位填写人的提交记录，共 ${data?.meta?.total ?? 0} 条。`}
      actions={
        <div className='flex items-center gap-2'>
          <Button variant='outline' asChild>
            <Link to='/survey'>
              <ArrowLeft className='h-4 w-4' />
              列表
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link to='/survey/$id/analysis' params={{ id: surveyId }}>
              <BarChart3 className='h-4 w-4' />
              数据分析
            </Link>
          </Button>
          <Button
            variant='outline'
            disabled={exporting}
            onClick={() => exportExcel(surveyId)}
          >
            <Download className='h-4 w-4' />
            导出
          </Button>
        </div>
      }
      className='flex flex-col gap-4 sm:gap-6'
    >
      <>
        <div
          role='toolbar'
          aria-orientation='horizontal'
          className='flex max-w-full items-center gap-2 self-end overflow-x-auto whitespace-nowrap'
        >
          <FilterMenu table={table} filters={recordFilterConfigs} align='end' />
          <DataGridSortMenu table={table} align='end' />
          <DataGridRowHeightMenu table={table} align='end' />
          <ColumnVisibility table={table} align='end' />
        </div>
        <div className='flex min-h-0 flex-1'>
          <DataGrid {...dataGridProps} table={table} height={height} />
        </div>
        <DataGridPagination table={table} className='mt-auto' />
      </>
    </PageLayout>
  )
}
