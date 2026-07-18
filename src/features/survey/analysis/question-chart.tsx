import React from 'react'
import type { QueryParams } from '@/types/api'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getQuestionNumberPrefix } from '@/features/survey/core/question-numbering'
import type {
  QuestionElement,
  SurveyDocument,
} from '@/features/survey/core/types'
import { getQuestionTypeLabel } from '@/features/survey/shared/question-type-labels'
import { useSurveyQuestionAnalysis } from '../query/hooks'
import { ChoiceChart } from './charts/choice-chart'
import { LikertChart } from './charts/likert-chart'
import { MatrixChart } from './charts/matrix-chart'
import { NumberChart } from './charts/number-chart'
import { RatingChart } from './charts/rating-chart'
import { TextAnswers } from './charts/text-answers'

/**
 * 针对不同题型设计的精致骨架屏
 */
function QuestionChartSkeleton({ type }: { type: string }) {
  switch (type) {
    case 'single_choice':
    case 'dropdown':
    case 'multiple_choice':
    case 'ranking':
    case 'cascader':
      return (
        <div className='space-y-4'>
          {Array.from({ length: 4 }).map((_, i) => {
            const widths = ['w-2/3', 'w-1/2', 'w-3/4', 'w-1/3']
            return (
              <div key={i} className='flex items-center justify-between gap-4'>
                <Skeleton className='bg-muted/60 h-4 w-1/5' shimmer />
                <div className='flex flex-1 items-center'>
                  <Skeleton
                    className={`h-6 ${widths[i]} bg-primary/10 rounded-md`}
                    shimmer
                  />
                </div>
                <Skeleton className='bg-muted/60 h-4 w-12' shimmer />
              </div>
            )
          })}
        </div>
      )

    case 'rating':
    case 'nps':
      return (
        <div className='grid gap-6 md:grid-cols-3'>
          <div className='border-muted/50 bg-muted/5 flex flex-col items-center justify-center space-y-2 rounded-xl border p-4'>
            <Skeleton className='bg-muted/60 h-4 w-2/3' shimmer />
            <Skeleton className='bg-primary/10 h-10 w-16 rounded-lg' shimmer />
            <Skeleton className='bg-muted/60 h-3 w-1/2' shimmer />
          </div>
          <div className='border-muted/30 flex h-[120px] items-end justify-between border-b px-4 pt-4 md:col-span-2'>
            {Array.from({ length: 5 }).map((_, i) => {
              const heights = [
                'h-[60px]',
                'h-[90px]',
                'h-[40px]',
                'h-[110px]',
                'h-[75px]',
              ]
              return (
                <div key={i} className='flex w-10 flex-col items-center gap-2'>
                  <Skeleton
                    className={`w-8 ${heights[i]} bg-primary/10 rounded-t-md`}
                    shimmer
                  />
                  <Skeleton className='bg-muted/60 h-3 w-4' shimmer />
                </div>
              )
            })}
          </div>
        </div>
      )

    case 'slider':
    case 'number':
      return (
        <div className='grid gap-4 sm:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='border-muted/50 bg-muted/5 space-y-2 rounded-xl border p-4'
            >
              <Skeleton className='bg-muted/60 h-3 w-1/2' shimmer />
              <Skeleton className='bg-primary/10 h-8 w-2/3' shimmer />
            </div>
          ))}
        </div>
      )

    case 'matrix_single':
    case 'matrix_multiple':
    case 'likert':
      return (
        <div className='space-y-4'>
          <div className='border-muted/50 flex items-center gap-4 border-b pb-2'>
            <div className='w-1/4'>
              <Skeleton className='bg-muted/80 h-4 w-2/3' shimmer />
            </div>
            <div className='flex flex-1 justify-between gap-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='bg-muted/60 h-4 w-16' shimmer />
              ))}
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='border-muted/20 flex items-center gap-4 border-b py-2'
            >
              <div className='w-1/4'>
                <Skeleton className='bg-muted/60 h-4 w-4/5' shimmer />
              </div>
              <div className='flex flex-1 justify-between gap-2'>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className='bg-primary/5 h-4 w-12' shimmer />
                ))}
              </div>
            </div>
          ))}
        </div>
      )

    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'date_range':
    default:
      return (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='border-muted/50 bg-muted/5 space-y-2 rounded-lg border p-3'
            >
              <div className='flex items-center justify-between'>
                <Skeleton className='bg-muted/60 h-3 w-16' shimmer />
                <Skeleton className='bg-muted/60 h-3 w-24' shimmer />
              </div>
              <Skeleton className='bg-primary/5 h-4 w-5/6' shimmer />
            </div>
          ))}
        </div>
      )
  }
}

interface QuestionChartProps {
  question: QuestionElement
  index: number
  document: SurveyDocument
  surveyId: string
  params?: QueryParams
}

export function QuestionChart({
  question,
  index,
  document,
  surveyId,
  params,
}: QuestionChartProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const {
    data: analysis,
    isLoading,
    error,
  } = useSurveyQuestionAnalysis(surveyId, question.id, params, {
    enabled: isVisible,
  })

  const typeLabel = getQuestionTypeLabel(question.type) || '未知题型'

  // 利用系统内置的题号前缀逻辑进行题号匹配
  const prefixText = React.useMemo(
    () => getQuestionNumberPrefix(question, document),
    [document, question]
  )

  // 如果系统内置题号不为空，则取其内容，否则回退到标准的 Q{index} 编号，确保数据分析页的参考性
  const prefixDisplay = React.useMemo(() => {
    if (prefixText) {
      return prefixText.trim()
    }
    return `Q${index}`
  }, [prefixText, index])

  const renderChart = () => {
    if (!isVisible) {
      return <QuestionChartSkeleton type={question.type} />
    }
    if (error) {
      return (
        <div className='flex items-start gap-3 rounded-lg border border-dashed p-4'>
          <AlertCircle className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
          <div className='space-y-1'>
            <div className='text-sm font-medium'>题目分析加载失败</div>
            <div className='text-muted-foreground text-xs'>
              {error instanceof Error
                ? error.message
                : '当前题目的数据请求异常，请刷新重试。'}
            </div>
          </div>
        </div>
      )
    }
    if (isLoading || !analysis) {
      return <QuestionChartSkeleton type={question.type} />
    }

    switch (analysis.type) {
      case 'single_choice':
      case 'dropdown':
      case 'multiple_choice':
      case 'ranking':
      case 'cascader':
        return <ChoiceChart analysis={analysis} />
      case 'rating':
      case 'nps':
        return <RatingChart analysis={analysis} />
      case 'slider':
      case 'number':
        return <NumberChart analysis={analysis} />
      case 'matrix_single':
      case 'matrix_multiple':
        return <MatrixChart analysis={analysis} />
      case 'likert':
        return <LikertChart analysis={analysis} />
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'url':
      case 'date':
      case 'date_range':
      default:
        return (
          <TextAnswers
            analysis={analysis}
            surveyId={surveyId}
            params={params}
          />
        )
    }
  }

  return (
    <div ref={containerRef}>
      <Card className='border-muted/80 overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md'>
        <CardHeader className='bg-muted/5 border-muted/50 space-y-3 border-b pb-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex min-w-[200px] flex-1 items-start gap-2.5'>
              <span className='bg-primary/10 text-primary flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1.5 font-mono text-xs font-bold'>
                {prefixDisplay}
              </span>
              <span className='text-foreground leading-relaxed font-semibold wrap-break-word'>
                {question.title || '（未命名题目）'}
              </span>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <Badge
                variant='secondary'
                className='px-2 py-0.5 text-[10px] font-normal'
              >
                {typeLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-6'>{renderChart()}</CardContent>
      </Card>
    </div>
  )
}
