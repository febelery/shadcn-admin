import { useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useTableState } from '@/hooks/use-table-state'
import { Button } from '@/components/ui/button'
import type { FilterConfig } from '@/components/filter-menu'
import { PageLayout } from '@/components/layout/page-layout'
import { useSurveyList } from '../query/hooks'
import { SurveyTable } from './survey-table'

const filterConfigs: FilterConfig[] = [
  {
    columnId: 'title',
    title: '标题',
  },
  {
    columnId: 'status',
    title: '状态',
    options: [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
      { label: '已归档', value: 'archived' },
    ],
    allowedOperators: ['is', 'isNot'],
  },
]

export function SurveyListPage() {
  const router = useRouter()
  const tableState = useTableState({
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    sorting: { enabled: true },
    filters: filterConfigs,
  })

  const params = tableState.getQueryParams()
  const { data, isFetching } = useSurveyList(params)

  const handleCreate = () => {
    const href = router.buildLocation({ to: '/survey/new' }).href
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <PageLayout
      title='问卷管理'
      description='设计问卷、发布 Schema、查看回收数据。'
      actions={
        <Button onClick={handleCreate}>
          <Plus data-icon='inline-start' />
          新建问卷
        </Button>
      }
      className='flex flex-1 flex-col gap-4 sm:gap-6'
    >
      <SurveyTable
        data={data?.data ?? []}
        total={data?.meta?.total ?? 0}
        isLoading={isFetching}
        tableState={tableState}
        onCreate={handleCreate}
      />
    </PageLayout>
  )
}
