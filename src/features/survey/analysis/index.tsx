import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Database,
  BarChart3,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { getSurveyQuestionAnalysis } from '@/api/survey'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { flattenQuestions } from '../core/schema-defaults'
import { useSurveyDetail, useSurveyAnalysis } from '../query/hooks'
import { OverviewCards } from './overview-cards'
import { QuestionChart } from './question-chart'
import { SegmentAnalysis } from './segment'

const QUESTION_ANALYSIS_DELAY_MS = 200

interface SurveyAnalysisPageProps {
  surveyId: string
}

function QuestionViewportObserver({
  questionId,
  onVisibleChange,
  children,
}: {
  questionId: string
  onVisibleChange: (questionId: string, isVisible: boolean) => void
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const onVisibleChangeRef = React.useRef(onVisibleChange)

  React.useEffect(() => {
    onVisibleChangeRef.current = onVisibleChange
  }, [onVisibleChange])

  React.useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibleChangeRef.current(questionId, entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.01,
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [questionId])

  return <div ref={ref}>{children}</div>
}

export function SurveyAnalysisPage({ surveyId }: SurveyAnalysisPageProps) {
  const { data: schema, isLoading: loadingSchema } = useSurveyDetail(surveyId)

  const questions = React.useMemo(() => {
    return schema ? flattenQuestions(schema) : []
  }, [schema])

  const {
    data: analysis,
    isLoading: loadingAnalysis,
    isRefetching,
    refetch,
  } = useSurveyAnalysis(surveyId)

  const [questionAnalyses, setQuestionAnalyses] = React.useState<
    Record<string, any>
  >({})
  const [questionErrors, setQuestionErrors] = React.useState<
    Record<string, string>
  >({})
  const [seenQuestionIds, setSeenQuestionIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [loadingQuestionId, setLoadingQuestionId] = React.useState<
    string | null
  >(null)
  const [cooldownTick, setCooldownTick] = React.useState(0)
  const loadVersionRef = React.useRef(0)
  const cooldownTimerRef = React.useRef<number | null>(null)

  const scheduleNextAttempt = React.useCallback((delayMs: number) => {
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }

    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownTimerRef.current = null
      setCooldownTick((prev) => prev + 1)
    }, delayMs)
  }, [])

  React.useEffect(() => {
    loadVersionRef.current += 1

    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setQuestionAnalyses({})
      setQuestionErrors({})
      setSeenQuestionIds(new Set())
      setLoadingQuestionId(null)
    })

    return () => {
      cancelled = true
    }
  }, [surveyId, questions, analysis])

  React.useEffect(() => {
    if (
      !analysis ||
      analysis.overview.totalRecords === 0 ||
      !questions.length
    ) {
      return
    }
    if (loadingQuestionId !== null) {
      return
    }
    if (cooldownTimerRef.current !== null) {
      return
    }

    const currentVersion = loadVersionRef.current
    const isQuestionDone = (questionId: string) =>
      Object.prototype.hasOwnProperty.call(questionAnalyses, questionId) ||
      Object.prototype.hasOwnProperty.call(questionErrors, questionId)

    const nextQuestion = questions.find((question, index) => {
      if (!seenQuestionIds.has(question.id)) return false
      if (isQuestionDone(question.id)) return false
      for (let i = 0; i < index; i += 1) {
        if (!isQuestionDone(questions[i].id)) return false
      }
      return true
    })

    if (!nextQuestion) return

    queueMicrotask(() => {
      if (currentVersion !== loadVersionRef.current) return
      setLoadingQuestionId(nextQuestion.id)

      getSurveyQuestionAnalysis(surveyId, nextQuestion.id)
        .then((result) => {
          if (currentVersion !== loadVersionRef.current) return
          setQuestionAnalyses((prev) => ({
            ...prev,
            [nextQuestion.id]: result,
          }))
        })
        .catch((err) => {
          if (currentVersion !== loadVersionRef.current) return
          console.error(
            `Failed to load analysis for question ${nextQuestion.id}`,
            err
          )
          setQuestionErrors((prev) => ({
            ...prev,
            [nextQuestion.id]:
              err instanceof Error ? err.message : '题目分析加载失败',
          }))
        })
        .finally(() => {
          if (currentVersion !== loadVersionRef.current) return
          setLoadingQuestionId(null)
          scheduleNextAttempt(QUESTION_ANALYSIS_DELAY_MS)
        })
    })
  }, [
    analysis,
    cooldownTick,
    loadingQuestionId,
    questionAnalyses,
    questionErrors,
    questions,
    scheduleNextAttempt,
    seenQuestionIds,
    surveyId,
  ])

  const handleQuestionVisibleChange = React.useCallback(
    (questionId: string, isVisible: boolean) => {
      if (!isVisible) return
      setSeenQuestionIds((prev) => {
        if (prev.has(questionId)) return prev
        const next = new Set(prev)
        next.add(questionId)
        return next
      })
    },
    []
  )

  const isLoading = loadingSchema || loadingAnalysis

  return (
    <PageLayout
      variant='default'
      title={schema ? `${schema.meta.title} · 数据分析` : '数据分析'}
      description='提供整体回收概况、逐题统计与服务端条件统计。'
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
              <Database className='h-4 w-4' />
              记录
            </Link>
          </Button>
          <Button
            variant='outline'
            onClick={() => refetch()}
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
      ) : analysis ? (
        <>
          <OverviewCards overview={analysis.overview} />

          <Tabs defaultValue='questions' className='space-y-4'>
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
              {analysis.overview.totalRecords === 0 ? (
                <div className='bg-muted/5 space-y-3 rounded-xl border border-dashed p-12 text-center'>
                  <div className='bg-muted text-muted-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-lg'>
                    <AlertCircle className='h-5 w-5' />
                  </div>
                  <div className='space-y-1'>
                    <h4 className='text-foreground text-sm font-semibold'>
                      无匹配的数据记录
                    </h4>
                    <p className='text-muted-foreground mx-auto max-w-xs text-xs'>
                      当前没有可用于逐题统计的回收答卷。
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-6'>
                  {questions.map((q, idx) => {
                    const qAnalysis = questionAnalyses[q.id]
                    const qError = questionErrors[q.id]
                    return (
                      <QuestionViewportObserver
                        key={q.id}
                        questionId={q.id}
                        onVisibleChange={handleQuestionVisibleChange}
                      >
                        <QuestionChart
                          question={q}
                          index={idx + 1}
                          analysis={qAnalysis}
                          error={qError}
                          isLoading={
                            loadingQuestionId === q.id && !qAnalysis && !qError
                          }
                          schema={schema}
                          surveyId={surveyId}
                        />
                      </QuestionViewportObserver>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value='segment' className='mt-0 space-y-4'>
              <SegmentAnalysis
                surveyId={surveyId}
                schema={schema}
                questions={questions}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className='bg-muted/5 space-y-3 rounded-xl border p-12 text-center'>
          <AlertCircle className='text-destructive mx-auto h-6 w-6' />
          <div className='space-y-1'>
            <h4 className='text-foreground text-sm font-semibold'>
              数据加载失败
            </h4>
            <p className='text-muted-foreground text-xs'>
              无法获取该问卷的数据统计分析，请刷新重试。
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => refetch()}>
            重新加载
          </Button>
        </div>
      )}
    </PageLayout>
  )
}
