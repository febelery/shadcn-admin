import React from 'react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'
import { Progress } from '@/components/ui/progress'
import type { NumericAnalysis } from '@/features/survey/core/analysis-schema'

interface RatingChartProps {
  analysis: NumericAnalysis
}

export function RatingChart({ analysis }: RatingChartProps) {
  const isNPS = analysis.type === 'nps'

  const answerCount = React.useMemo(() => {
    return analysis.distribution.reduce((sum, item) => sum + item.count, 0)
  }, [analysis.distribution])

  const chartData = React.useMemo(() => {
    return analysis.distribution.map((dist) => ({
      name: String(dist.score),
      数量: dist.count,
      比例: (dist.percentage * 100).toFixed(1) + '%',
    }))
  }, [analysis.distribution])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-stretch gap-4'>
        {/* NPS Metrics Panel */}
        {isNPS && analysis.npsScore !== undefined && (
          <div className='bg-primary/2 flex min-w-[200px] flex-1 flex-col justify-between gap-3 rounded-xl border p-4'>
            <div className='space-y-1'>
              <div className='text-muted-foreground text-xs font-medium'>
                净推荐值 (NPS)
              </div>
              <div className='text-primary font-mono text-4xl font-extrabold tracking-tight'>
                {analysis.npsScore > 0
                  ? `+${analysis.npsScore}`
                  : analysis.npsScore}
              </div>
            </div>
            <div className='space-y-2 text-xs'>
              <div className='text-muted-foreground flex items-center justify-between gap-4'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-emerald-500' />
                  推荐者 (9-10分)
                </span>
                <span className='text-foreground font-mono font-medium'>
                  {analysis.promoters ?? 0} 人 (
                  {answerCount > 0
                    ? (((analysis.promoters ?? 0) / answerCount) * 100).toFixed(
                        0
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className='text-muted-foreground flex items-center justify-between gap-4'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-amber-400' />
                  被动者 (7-8分)
                </span>
                <span className='text-foreground font-mono font-medium'>
                  {analysis.passives ?? 0} 人 (
                  {answerCount > 0
                    ? (((analysis.passives ?? 0) / answerCount) * 100).toFixed(
                        0
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className='text-muted-foreground flex items-center justify-between gap-4'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-rose-500' />
                  贬损者 (0-6分)
                </span>
                <span className='text-foreground font-mono font-medium'>
                  {analysis.detractors ?? 0} 人 (
                  {answerCount > 0
                    ? (
                        ((analysis.detractors ?? 0) / answerCount) *
                        100
                      ).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Average Metrics Panel */}
        <div className='bg-muted/10 flex min-w-[160px] flex-1 flex-col justify-center gap-1 rounded-xl border p-4'>
          <div className='text-muted-foreground text-xs font-medium'>
            平均值 (Average)
          </div>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight'>
            {analysis.avgScore}
          </div>
        </div>

        {/* Median Metrics Panel */}
        <div className='bg-muted/10 flex min-w-[160px] flex-1 flex-col justify-center gap-1 rounded-xl border p-4'>
          <div className='text-muted-foreground text-xs font-medium'>
            中位数 (Median)
          </div>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight'>
            {analysis.medianScore}
          </div>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Score Distribution Details */}
        <div className='space-y-4'>
          <div className='text-muted-foreground text-xs font-medium'>
            分值分布明细
          </div>
          <div className='max-h-[220px] space-y-2.5 overflow-y-auto pr-1'>
            {analysis.distribution.map((dist, i) => (
              <div key={i} className='space-y-1'>
                <div className='flex items-center justify-between gap-4 text-xs'>
                  <span className='text-foreground font-mono font-medium'>
                    {dist.score} {isNPS ? '分' : ''}
                  </span>
                  <div className='text-muted-foreground flex shrink-0 items-center gap-2'>
                    <span className='text-foreground font-mono font-medium'>
                      {dist.count} 人
                    </span>
                    <span className='w-10 text-right font-mono'>
                      {(dist.percentage * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={dist.percentage * 100}
                  className='bg-muted/60 h-1.5'
                />
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution Visual Chart */}
        <div className='bg-muted/5 flex h-[200px] items-center justify-center rounded-xl border border-dashed p-3'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id='colorRating' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--primary)'
                    stopOpacity={0.3}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--primary)'
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey='name'
                stroke='#888888'
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#888888'
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    return (
                      <div className='bg-background space-y-1 rounded-lg border p-2.5 text-xs shadow-md'>
                        <div className='font-semibold'>分值: {item.name}</div>
                        <div className='text-muted-foreground flex items-center gap-4'>
                          <span>
                            人数:{' '}
                            <strong className='text-foreground'>
                              {item.数量}
                            </strong>
                          </span>
                          <span>
                            比例:{' '}
                            <strong className='text-foreground'>
                              {item.比例}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type='monotone'
                dataKey='数量'
                stroke='var(--primary)'
                strokeWidth={2}
                fillOpacity={1}
                fill='url(#colorRating)'
                activeDot={{ r: 5 }}
                dot={{ r: 3, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
