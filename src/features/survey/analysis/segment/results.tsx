import React from 'react'
import { AlertCircle, Info, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  SegmentDefinition,
  SurveySegmentAnalysisResult,
} from '@/features/survey/core/analysis-types'
import type {
  SurveySchema,
  QuestionElement,
} from '@/features/survey/core/types'
import { formatPercent, getSegmentPreview } from './utils'

interface SegmentResultsProps {
  data: SurveySegmentAnalysisResult | undefined
  isLoading: boolean
  isError: boolean
  appliedSegments: SegmentDefinition[]
  appliedConditionCount: number
  hasPendingChanges: boolean
  questionMap: Map<string, QuestionElement>
  schema: SurveySchema
  questions: QuestionElement[]
  isFetching?: boolean
  refetch?: () => void
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className='bg-background/60 border-muted/70 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed px-6 text-center'>
      <div className='space-y-2.5'>
        <div className='bg-muted/10 text-muted-foreground border-muted/80 mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-dashed'>
          <Info className='h-5 w-5' />
        </div>
        <div className='space-y-1'>
          <div className='text-foreground text-sm font-semibold'>{title}</div>
          <p className='text-muted-foreground text-xs'>{description}</p>
        </div>
      </div>
    </div>
  )
}

const CHART_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
]

export const SegmentResults = React.memo(function SegmentResults({
  data,
  isLoading,
  isError,
  appliedSegments,
  hasPendingChanges,
  questionMap,
  schema,
  questions,
  isFetching = false,
  refetch,
}: SegmentResultsProps) {
  const largestSegment = React.useMemo(() => {
    if (!data?.segments || data.segments.length === 0) return null
    return [...data.segments].sort((a, b) => b.count - a.count)[0]
  }, [data])

  return (
    <div className='border-muted bg-background relative min-h-[200px] overflow-hidden rounded-xl border shadow-sm'>
      {/* 磨砂刷新加载遮罩 */}
      {isFetching && !isLoading && (
        <div className='bg-background/60 animate-fade-in border-muted absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed backdrop-blur-[1px]'>
          <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
          <span className='text-muted-foreground text-xs font-medium tracking-wide'>
            正在计算最新数据...
          </span>
        </div>
      )}

      {/* 顶部标题栏 */}
      <div className='border-muted bg-muted/10 flex items-center justify-between border-b px-4 py-3'>
        <div className='min-w-0'>
          <h3 className='text-foreground text-xs font-semibold'>
            群体对比分析结果
          </h3>
          <p className='text-muted-foreground mt-0.5 text-[11px]'>
            {appliedSegments.length > 0
              ? `已生效 ${appliedSegments.length} 组对比分群的样本分布与统计报表。`
              : '当前未生效任何过滤条件，分析视图暂无统计结果。'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {hasPendingChanges && appliedSegments.length > 0 && (
            <Badge
              variant='outline'
              className='rounded border-amber-500/30 bg-amber-500/5 text-[10px] font-normal text-amber-600'
            >
              草稿未应用
            </Badge>
          )}
          {appliedSegments.length > 0 && refetch && (
            <Button
              variant='outline'
              size='sm'
              className='text-muted-foreground border-muted-foreground/30 hover:bg-muted/10 bg-background flex h-7 items-center gap-1.5 rounded px-2.5 text-xs shadow-none'
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn('h-3 w-3', isFetching && 'animate-spin')}
              />
              刷新
            </Button>
          )}
        </div>
      </div>

      <div className='space-y-4 p-4'>
        {/* 生效条件胶囊预览 */}
        {appliedSegments.length > 0 && (
          <div className='bg-muted/10 border-muted space-y-2 rounded-lg border p-3 text-xs'>
            <div className='text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium'>
              <Info className='text-primary h-3.5 w-3.5 shrink-0' />
              当前分析数据基于以下样本分组逻辑计算：
            </div>
            <div className='flex flex-col gap-2'>
              {appliedSegments.map((segment, idx) => {
                const condTexts = getSegmentPreview(
                  segment,
                  questionMap,
                  schema,
                  questions
                )
                const chartBg = CHART_COLORS[idx % CHART_COLORS.length]
                return (
                  <div
                    key={segment.id}
                    className='flex flex-wrap items-center gap-1.5 leading-relaxed'
                  >
                    <span className='bg-background border-muted-foreground/20 text-foreground/80 flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold'>
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          chartBg
                        )}
                      />
                      {segment.label || `对比组 ${idx + 1}`}
                    </span>
                    <span className='text-muted-foreground text-[10px] font-normal'>
                      符合以下全部：
                    </span>
                    {condTexts.map((text, cIdx) => (
                      <React.Fragment key={cIdx}>
                        {cIdx > 0 && (
                          <span className='text-muted-foreground px-0.5 font-mono text-[9px] font-bold'>
                            AND
                          </span>
                        )}
                        <span
                          className='bg-background border-muted/80 text-muted-foreground max-w-[280px] truncate rounded border px-1.5 py-0.5 text-[10px]'
                          title={text}
                        >
                          {text}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className='space-y-3.5'>
            <Skeleton className='h-10 w-full rounded-lg' shimmer />
            <Skeleton className='h-12 w-full rounded-lg' shimmer />
            <Skeleton className='h-12 w-full rounded-lg' shimmer />
          </div>
        ) : isError ? (
          <div className='bg-background/60 border-muted flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center'>
            <AlertCircle className='text-destructive h-5 w-5' />
            <div className='space-y-1'>
              <h4 className='text-foreground text-xs font-semibold'>
                无法加载分析数据
              </h4>
              <p className='text-muted-foreground text-[11px]'>
                请检查网络并重试。
              </p>
            </div>
          </div>
        ) : appliedSegments.length === 0 ? (
          <EmptyState
            title='待执行筛选'
            description='请在上方配置各对比组的筛选条件，然后点击“确定筛选”以生成分析结果。'
          />
        ) : data ? (
          <div className='space-y-4'>
            {/* 三维核心指标卡片 */}
            <div
              className={cn(
                'grid grid-cols-1 gap-3',
                data.total !== undefined ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
              )}
            >
              {data.total !== undefined && (
                <div className='border-muted bg-card flex flex-col justify-between rounded-lg border p-3 shadow-none'>
                  <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                    有效样本总数 (基线)
                  </span>
                  <div className='text-foreground/90 mt-1 flex items-baseline gap-1 font-mono text-lg font-bold tracking-tight'>
                    {data.total.toLocaleString()}
                    <span className='text-muted-foreground font-sans text-[10px] font-normal'>
                      人
                    </span>
                  </div>
                </div>
              )}
              <div className='border-muted bg-card flex flex-col justify-between rounded-lg border p-3 shadow-none'>
                <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                  已生效对比组
                </span>
                <div className='text-foreground/90 mt-1 flex items-baseline gap-1 font-mono text-lg font-bold tracking-tight'>
                  {appliedSegments.length}
                  <span className='text-muted-foreground font-sans text-[10px] font-normal'>
                    组
                  </span>
                </div>
              </div>
              <div className='border-muted bg-card flex flex-col justify-between rounded-lg border p-3 shadow-none'>
                <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                  符合人数最多组
                </span>
                {largestSegment ? (
                  <div className='text-foreground/90 mt-1 flex items-baseline gap-1 truncate font-mono text-lg font-bold tracking-tight'>
                    <span
                      className='text-foreground max-w-[100px] truncate text-xs font-semibold'
                      title={largestSegment.label}
                    >
                      {largestSegment.label}
                    </span>
                    <span>
                      {largestSegment.count.toLocaleString()}
                      <span className='text-muted-foreground ml-0.5 font-sans text-[10px] font-normal'>
                        人
                      </span>
                    </span>
                    <span className='text-muted-foreground font-sans text-[10px] font-normal'>
                      ({formatPercent(largestSegment.percentage)})
                    </span>
                  </div>
                ) : (
                  <div className='text-muted-foreground mt-1 text-xs'>-</div>
                )}
              </div>
            </div>

            {/* 可视化百分比渗透对比条 */}
            {Array.isArray(data.segments) && data.segments.length > 0 && (
              <div className='border-muted bg-card space-y-3 rounded-lg border p-4 shadow-none'>
                <div className='flex items-center justify-between'>
                  <span className='text-foreground/80 text-xs font-semibold'>
                    样本分群分布对比
                  </span>
                  <span className='text-muted-foreground text-[10px]'>
                    百分比为该组在全体答卷中的占比
                  </span>
                </div>
                <div className='space-y-3.5 pt-1'>
                  {/* 全量基线行 */}
                  {data.total !== undefined && (
                    <div className='flex items-center gap-3 text-xs'>
                      <span className='text-muted-foreground w-24 shrink-0 truncate font-semibold'>
                        全体样本 (基线)
                      </span>
                      <div className='bg-muted/40 relative h-2 flex-1 overflow-hidden rounded'>
                        <div className='bg-muted-foreground/30 absolute top-0 bottom-0 left-0 w-full rounded' />
                      </div>
                      <span className='text-muted-foreground w-10 shrink-0 text-right font-mono font-medium'>
                        100%
                      </span>
                      <span className='text-muted-foreground w-14 shrink-0 text-right font-mono text-[10px]'>
                        {data.total.toLocaleString()} 人
                      </span>
                    </div>
                  )}

                  {/* 各对比组行 */}
                  {data.segments.map((segment, idx) => {
                    const chartColor = CHART_COLORS[idx % CHART_COLORS.length]
                    return (
                      <div
                        key={segment.id}
                        className='flex items-center gap-3 text-xs'
                      >
                        <span
                          className='text-foreground/75 w-24 shrink-0 truncate font-semibold'
                          title={segment.label}
                        >
                          {segment.label}
                        </span>
                        <div className='bg-muted/30 border-muted-foreground/5 relative h-2 flex-1 overflow-hidden rounded border'>
                          <div
                            className={cn(
                              'absolute top-0 bottom-0 left-0 rounded transition-all duration-700 ease-out',
                              chartColor
                            )}
                            style={{
                              width: `${Math.min(100, segment.percentage * 100)}%`,
                            }}
                          />
                        </div>
                        <span className='text-foreground w-10 shrink-0 text-right font-mono font-bold'>
                          {formatPercent(segment.percentage)}
                        </span>
                        <span className='text-muted-foreground w-14 shrink-0 text-right font-mono text-[10px]'>
                          {segment.count} 人
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 表格详细清单 */}
            {Array.isArray(data.segments) && (
              <div className='border-muted bg-background overflow-hidden rounded-lg border shadow-none'>
                <Table>
                  <TableHeader className='bg-muted/10'>
                    <TableRow className='border-muted border-b hover:bg-transparent'>
                      <TableHead className='text-foreground/80 h-9 px-4 text-xs font-semibold'>
                        对比组名称
                      </TableHead>
                      <TableHead className='text-foreground/80 h-9 text-xs font-semibold'>
                        条件数
                      </TableHead>
                      <TableHead className='text-foreground/80 h-9 text-xs font-semibold'>
                        符合样本数
                      </TableHead>
                      <TableHead className='text-foreground/80 h-9 text-xs font-semibold'>
                        样本占比
                      </TableHead>
                      <TableHead className='text-foreground/80 h-9 w-[200px] px-4 text-xs font-semibold'>
                        快速可视化
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.segments.map((segment, idx) => (
                      <TableRow
                        key={segment.id}
                        className='hover:bg-muted/5 border-muted border-b transition-colors last:border-0'
                      >
                        <TableCell className='px-4 py-2.5'>
                          <div className='text-foreground/90 max-w-[320px] truncate text-xs font-semibold'>
                            {segment.label}
                          </div>
                        </TableCell>
                        <TableCell className='text-muted-foreground py-2.5 font-mono text-xs'>
                          {segment.conditions.length}
                        </TableCell>
                        <TableCell className='text-foreground/90 py-2.5 font-mono text-sm font-bold'>
                          {segment.count.toLocaleString()}
                          <span className='text-muted-foreground ml-0.5 font-sans text-[10px] font-normal'>
                            人
                          </span>
                        </TableCell>
                        <TableCell className='text-muted-foreground py-2.5 font-mono text-xs'>
                          {formatPercent(segment.percentage)}
                        </TableCell>
                        <TableCell className='px-4 py-2.5'>
                          <div className='bg-muted/40 border-muted/50 relative h-1.5 w-[160px] overflow-hidden rounded-full border'>
                            <div
                              className={cn(
                                'absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500',
                                CHART_COLORS[idx % CHART_COLORS.length]
                              )}
                              style={{ width: `${segment.percentage * 100}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
})
