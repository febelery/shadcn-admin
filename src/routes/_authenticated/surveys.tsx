import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSurveys, useCreateSurvey } from '@/features/surveys/hooks/use-surveys'
import { SurveysTable } from '@/features/surveys/components/surveys-table'
import { PageLayout } from '@/components/layout/page-layout'
import { useTableState } from '@/hooks/use-table-state'
import { type FilterConfig } from '@/components/filter-menu'

export const Route = createFileRoute('/_authenticated/surveys')({
  component: SurveysPage,
})

function SurveysPage() {
  const filterConfigs: FilterConfig[] = [
    {
      columnId: 'status',
      title: '状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已归档', value: 'archived' },
      ],
    },
    {
      columnId: 'mode',
      title: '模式',
      options: [
        { label: '滚动', value: 'scroll' },
        { label: '卡片', value: 'card' },
      ],
    },
  ]

  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    sorting: { enabled: true },
    filters: filterConfigs,
  })

  const { data, isFetching } = useSurveys(tableState.getQueryParams())
  const { mutateAsync: createSurvey, isPending: isCreating } = useCreateSurvey()

  const openBuilder = (id: string) => {
    window.open(`/survey/builder/${id}`, `builder_${id}`, 'noopener,noreferrer')
  }

  const handleCreate = async () => {
    const { id } = await createSurvey('未命名问卷')
    openBuilder(id)
  }

  return (
    <PageLayout
      title="问卷管理"
      description="创建和管理您的问卷调查，支持分页、筛选及全路径管理。"
      actions={
        <Button className="gap-1.5" onClick={handleCreate} disabled={isCreating}>
          <Plus className="h-4 w-4" />
          {isCreating ? '创建中...' : '新建问卷'}
        </Button>
      }
      className="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      <SurveysTable
        data={data?.data || []}
        total={data?.meta?.total || 0}
        isLoading={isFetching}
        tableState={tableState}
        onOpenBuilder={openBuilder}
      />
    </PageLayout>
  )
}
