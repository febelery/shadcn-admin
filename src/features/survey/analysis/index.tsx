import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  AlertCircle,
  Filter,
  Inbox,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { flattenQuestions } from '../core/document-elements'
import { useSurveyDetail, useSurveyAnalysis } from '../query/hooks'
import { surveyKeys } from '../query/keys'
import { OverviewCards } from './overview-cards'
import { QuestionChart } from './question-chart'
import { SegmentAnalysis } from './segment'

interface SurveyAnalysisPageProps {
  surveyId: string
}

export function SurveyAnalysisPage({ surveyId }: SurveyAnalysisPageProps) {
  const queryClient = useQueryClient()
  const { data: document, isLoading: loadingDocument } =
    useSurveyDetail(surveyId)

  const questions = React.useMemo(() => {
    return document ? flattenQuestions(document) : []
  }, [document])

  const {
    data: analysis,
    isLoading: loadingAnalysis,
    isRefetching,
  } = useSurveyAnalysis(surveyId)

  const [activeTab, setActiveTab] = React.useState('questions')

  const handleRefresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: surveyKeys.analysis(surveyId),
    })
  }, [queryClient, surveyId])

  const isLoading = loadingDocument || loadingAnalysis

  return (
    <PageLayout
      variant='default'
      title={document ? `${document.meta.title} · 分析` : '分析'}
      description='查看回收概况和题目统计。'
      actions={
        <div className='flex items-center gap-2'>
          <Button variant='outline' asChild>
            <Link to='/survey'>
              <ArrowLeft className='h-4 w-4' />
              列表
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link to={`/survey/${surveyId}/record`}>
              <Inbox className='h-4 w-4' />
              回收
            </Link>
          </Button>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
        </div>
      }
      className='flex flex-col gap-6 p-4 sm:p-6'
    >
      {isLoading ? (
        <div className='space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='bg-muted/5 space-y-3 rounded-xl border p-6'
              >
                <Skeleton className='h-4 w-1/3' shimmer />
                <Skeleton className='h-8 w-2/3' shimmer />
                <Skeleton className='h-3 w-1/2' shimmer />
              </div>
            ))}
          </div>
          <div className='bg-muted/5 space-y-4 rounded-xl border p-6'>
            <Skeleton className='h-4 w-1/4' shimmer />
            <Skeleton className='h-[200px] w-full' shimmer />
          </div>
          <div className='space-y-6'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className='bg-muted/5 space-y-4 rounded-xl border p-6'
              >
                <Skeleton className='h-5 w-1/2' shimmer />
                <div className='grid gap-6 md:grid-cols-2'>
                  <Skeleton className='h-[160px] w-full' shimmer />
                  <Skeleton className='h-[160px] w-full' shimmer />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : analysis && document ? (
        <>
          <OverviewCards overview={analysis.overview} />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-4'
          >
            <div className='border-muted/70 bg-card/70 overflow-hidden rounded-2xl border shadow-sm'>
              <div className='border-muted/60 flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-end sm:justify-between'>
                <div className='min-w-0 space-y-1.5'>
                  <div className='flex items-center gap-2'>
                    <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
                      <BarChart3 className='h-4 w-4' />
                    </div>
                    <div className='min-w-0'>
                      <div className='text-foreground text-sm font-semibold'>
                        分析视图
                      </div>
                    </div>
                  </div>
                </div>
                <TabsList className='border-muted/60 bg-muted/40 grid h-11 w-full grid-cols-2 rounded-2xl border p-1 sm:w-[360px]'>
                  <TabsTrigger
                    value='questions'
                    className='h-9 rounded-xl text-xs'
                  >
                    <BarChart3 className='h-4 w-4' />
                    题目
                  </TabsTrigger>
                  <TabsTrigger
                    value='segment'
                    className='h-9 rounded-xl text-xs'
                  >
                    <Filter className='h-4 w-4' />
                    条件
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value='questions' className='mt-0 space-y-4'>
              {activeTab === 'questions' &&
                (analysis.overview.totalRecords === 0 ? (
                  <div className='bg-muted/5 space-y-3 rounded-xl border border-dashed p-12 text-center'>
                    <div className='bg-muted text-muted-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-lg'>
                      <AlertCircle className='h-5 w-5' />
                    </div>
                    <div className='space-y-1'>
                      <h4 className='text-foreground text-sm font-semibold'>
                        暂无答卷
                      </h4>
                      <p className='text-muted-foreground mx-auto max-w-xs text-xs'>
                        回收后可查看逐题统计。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col gap-6'>
                    {questions.map((q, idx) => (
                      <QuestionChart
                        key={q.id}
                        question={q}
                        index={idx + 1}
                        document={document}
                        surveyId={surveyId}
                      />
                    ))}
                  </div>
                ))}
            </TabsContent>

            <TabsContent value='segment' className='mt-0 space-y-4'>
              {activeTab === 'segment' && (
                <SegmentAnalysis
                  surveyId={surveyId}
                  document={document}
                  questions={questions}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className='bg-muted/5 space-y-3 rounded-xl border p-12 text-center'>
          <AlertCircle className='text-destructive mx-auto h-6 w-6' />
          <div className='space-y-1'>
            <h4 className='text-foreground text-sm font-semibold'>
              分析加载失败
            </h4>
            <p className='text-muted-foreground text-xs'>请刷新重试。</p>
          </div>
          <Button variant='outline' size='sm' onClick={handleRefresh}>
            重新加载
          </Button>
        </div>
      )}
    </PageLayout>
  )
}
