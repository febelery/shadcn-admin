import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout } from '@/components/layout/page-layout'
import { flattenQuestions } from '../core/document-elements'
import { getQuestionNumberPrefix } from '../core/question-numbering'
import { useSurveyDetail, useSurveyAnalysis } from '../query/hooks'
import { surveyKeys } from '../query/keys'
import { getQuestionTypeLabel } from '../shared/question-type-labels'
import { OverviewCards } from './overview-cards'
import { QuestionChart } from './question-chart'

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

  const [selectedQuestionId, setSelectedQuestionId] = React.useState<string>('')
  const [keyword, setKeyword] = React.useState('')
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map())

  // 确保选中的题目有效，默认聚焦第一题
  const activeQuestionId = React.useMemo(() => {
    if (
      selectedQuestionId &&
      questions.some((q) => q.id === selectedQuestionId)
    ) {
      return selectedQuestionId
    }
    return questions[0]?.id ?? ''
  }, [selectedQuestionId, questions])

  // 自动将当前选中的题目平滑滚动至题目列表可视区
  React.useEffect(() => {
    if (activeQuestionId) {
      const el = itemRefs.current.get(activeQuestionId)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeQuestionId])

  const activeIndex = React.useMemo(() => {
    return questions.findIndex((q) => q.id === activeQuestionId)
  }, [questions, activeQuestionId])

  const activeQuestion = questions[activeIndex]

  const filteredQuestions = React.useMemo(() => {
    if (!keyword.trim()) return questions
    const kw = keyword.trim().toLowerCase()
    return questions.filter((q) =>
      (q.title || '（未命名题目）').toLowerCase().includes(kw)
    )
  }, [questions, keyword])

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
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link to='/survey' />}
          >
            <ArrowLeft className='h-4 w-4' />
            列表
          </Button>
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link to={`/survey/${surveyId}/record`} />}
          >
            <Inbox className='h-4 w-4' />
            回收
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

          {analysis.overview.totalRecords === 0 ? (
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
          ) : questions.length === 0 ? (
            <div className='bg-muted/5 space-y-3 rounded-xl border border-dashed p-12 text-center'>
              <div className='bg-muted text-muted-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-lg'>
                <AlertCircle className='h-5 w-5' />
              </div>
              <div className='space-y-1'>
                <h4 className='text-foreground text-sm font-semibold'>
                  暂无题目
                </h4>
                <p className='text-muted-foreground mx-auto max-w-xs text-xs'>
                  问卷中尚未配置可分析的题目。
                </p>
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
              {/* 左侧：题目目录导航 */}
              <div className='bg-card border-border/70 flex w-full flex-col overflow-hidden rounded-xl border shadow-xs lg:sticky lg:top-4 lg:w-80 lg:shrink-0 xl:w-96'>
                <div className='border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-foreground text-sm font-semibold'>
                      题目列表
                    </span>
                    <Badge variant='secondary' className='text-xs font-normal'>
                      {questions.length} 题
                    </Badge>
                  </div>
                  {keyword && (
                    <span className='text-muted-foreground text-xs'>
                      匹配 {filteredQuestions.length} 题
                    </span>
                  )}
                </div>

                {questions.length > 5 && (
                  <div className='border-border/60 border-b p-2.5'>
                    <div className='relative'>
                      <Search className='text-muted-foreground absolute top-2.5 left-2.5 size-3.5' />
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder='搜索题目…'
                        className='h-8 pl-8 text-xs'
                      />
                    </div>
                  </div>
                )}

                <div className='max-h-[380px] space-y-1 overflow-y-auto p-2 sm:max-h-[440px] lg:max-h-[500px]'>
                  {filteredQuestions.length === 0 ? (
                    <div className='text-muted-foreground py-6 text-center text-xs'>
                      未找到匹配题目
                    </div>
                  ) : (
                    filteredQuestions.map((q) => {
                      const qIdx = questions.findIndex(
                        (item) => item.id === q.id
                      )
                      const isSelected = q.id === activeQuestionId
                      const rawPrefix = getQuestionNumberPrefix(
                        q,
                        document
                      )?.trim()
                      const prefix =
                        (rawPrefix ? rawPrefix.replace(/[.、:]+$/, '') : '') ||
                        `Q${qIdx + 1}`
                      const typeLabel =
                        getQuestionTypeLabel(q.type) || '未知题型'

                      return (
                        <button
                          key={q.id}
                          ref={(el) => {
                            if (el) {
                              itemRefs.current.set(q.id, el)
                            } else {
                              itemRefs.current.delete(q.id)
                            }
                          }}
                          type='button'
                          onClick={() => setSelectedQuestionId(q.id)}
                          className={cn(
                            'flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors',
                            isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-foreground/85 hover:bg-muted/60'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1 font-mono text-[11px] font-bold',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {prefix}
                          </span>
                          <span className='line-clamp-2 min-w-0 flex-1 leading-5'>
                            {q.title || '（未命名题目）'}
                          </span>
                          <Badge
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'shrink-0 text-[10px] font-normal px-1.5 py-0',
                              isSelected &&
                                'bg-primary/20 text-primary hover:bg-primary/20'
                            )}
                          >
                            {typeLabel}
                          </Badge>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 右侧：单题详尽图表及切题翻页栏 */}
              <div className='flex min-w-0 flex-1 flex-col gap-4'>
                <div className='bg-card border-border/70 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 shadow-xs'>
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='text-muted-foreground'>当前查看：</span>
                    <span className='text-foreground font-semibold'>
                      第 {activeIndex + 1} / {questions.length} 题
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-7 px-2.5 text-xs'
                      disabled={activeIndex <= 0}
                      onClick={() => {
                        if (activeIndex > 0) {
                          setSelectedQuestionId(questions[activeIndex - 1].id)
                        }
                      }}
                    >
                      <ChevronLeft className='mr-1 size-3.5' />
                      上一题
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-7 px-2.5 text-xs'
                      disabled={activeIndex >= questions.length - 1}
                      onClick={() => {
                        if (activeIndex < questions.length - 1) {
                          setSelectedQuestionId(questions[activeIndex + 1].id)
                        }
                      }}
                    >
                      下一题
                      <ChevronRight className='ml-1 size-3.5' />
                    </Button>
                  </div>
                </div>

                {activeQuestion ? (
                  <QuestionChart
                    key={activeQuestion.id}
                    question={activeQuestion}
                    index={activeIndex + 1}
                    document={document}
                    surveyId={surveyId}
                  />
                ) : null}
              </div>
            </div>
          )}
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
