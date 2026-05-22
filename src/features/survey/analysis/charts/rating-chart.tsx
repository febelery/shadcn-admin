import React from 'react'
import type { RatingAnalysis } from '@/features/survey/core/analysis-types'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Progress } from '@/components/ui/progress'

interface RatingChartProps {
  analysis: RatingAnalysis
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
          <div className='flex-1 min-w-[200px] border rounded-xl p-4 bg-primary/2 flex flex-col justify-between gap-3'>
            <div className='space-y-1'>
              <div className='text-muted-foreground text-xs font-medium'>净推荐值 (NPS)</div>
              <div className='text-4xl font-extrabold tracking-tight font-mono text-primary'>
                {analysis.npsScore > 0 ? `+${analysis.npsScore}` : analysis.npsScore}
              </div>
            </div>
            <div className='space-y-2 text-xs'>
              <div className='flex justify-between items-center gap-4 text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-emerald-500' />
                  推荐者 (9-10分)
                </span>
                <span className='font-mono font-medium text-foreground'>
                  {analysis.promoters ?? 0} 人 (
                  {answerCount > 0
                    ? (((analysis.promoters ?? 0) / answerCount) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div className='flex justify-between items-center gap-4 text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-amber-400' />
                  被动者 (7-8分)
                </span>
                <span className='font-mono font-medium text-foreground'>
                  {analysis.passives ?? 0} 人 (
                  {answerCount > 0
                    ? (((analysis.passives ?? 0) / answerCount) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div className='flex justify-between items-center gap-4 text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full bg-rose-500' />
                  贬损者 (0-6分)
                </span>
                <span className='font-mono font-medium text-foreground'>
                  {analysis.detractors ?? 0} 人 (
                  {answerCount > 0
                    ? (((analysis.detractors ?? 0) / answerCount) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Average Metrics Panel */}
        <div className='flex-1 min-w-[160px] border rounded-xl p-4 bg-muted/10 flex flex-col justify-center gap-1'>
          <div className='text-muted-foreground text-xs font-medium'>平均值 (Average)</div>
          <div className='text-3xl font-bold tracking-tight font-mono text-foreground'>
            {analysis.avgScore ?? 0}
          </div>
        </div>

        {/* Median Metrics Panel */}
        <div className='flex-1 min-w-[160px] border rounded-xl p-4 bg-muted/10 flex flex-col justify-center gap-1'>
          <div className='text-muted-foreground text-xs font-medium'>中位数 (Median)</div>
          <div className='text-3xl font-bold tracking-tight font-mono text-foreground'>
            {analysis.medianScore ?? 0}
          </div>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Score Distribution Details */}
        <div className='space-y-4'>
          <div className='text-muted-foreground text-xs font-medium'>分值分布明细</div>
          <div className='space-y-2.5 max-h-[220px] overflow-y-auto pr-1'>
            {analysis.distribution.map((dist, i) => (
              <div key={i} className='space-y-1'>
                <div className='flex items-center justify-between text-xs gap-4'>
                  <span className='font-medium text-foreground font-mono'>
                    {dist.score} {isNPS ? '分' : ''}
                  </span>
                  <div className='flex items-center gap-2 shrink-0 text-muted-foreground'>
                    <span className='font-mono font-medium text-foreground'>{dist.count} 人</span>
                    <span className='font-mono w-10 text-right'>{(dist.percentage * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Progress value={dist.percentage * 100} className='h-1.5 bg-muted/60' />
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution Visual Chart */}
        <div className='h-[200px] flex items-center justify-center bg-muted/5 rounded-xl border p-3 border-dashed'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey='name' stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke='#888888' fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    return (
                      <div className='bg-background rounded-lg border p-2.5 shadow-md text-xs space-y-1'>
                        <div className='font-semibold'>分值: {item.name}</div>
                        <div className='flex items-center gap-4 text-muted-foreground'>
                          <span>人数: <strong className='text-foreground'>{item.数量}</strong></span>
                          <span>比例: <strong className='text-foreground'>{item.比例}</strong></span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey='数量'
                fill='currentColor'
                radius={[4, 4, 0, 0]}
                className='fill-primary/95'
                barSize={isNPS ? 14 : 24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
