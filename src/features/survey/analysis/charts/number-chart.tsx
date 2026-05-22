import React from 'react'
import type { RatingAnalysis } from '@/features/survey/core/analysis-types'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  PlusCircle,
  BarChart2,
  Activity,
} from 'lucide-react'

interface NumberChartProps {
  analysis: RatingAnalysis
}

export function NumberChart({ analysis }: NumberChartProps) {
  const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar')

  // 科学兜底计算各项统计指标，防止后端数据未下发或被缓存
  const stats = React.useMemo(() => {
    const hasBackEndStats =
      analysis.minScore !== undefined &&
      analysis.maxScore !== undefined &&
      analysis.sumScore !== undefined

    if (hasBackEndStats) {
      return {
        min: analysis.minScore ?? 0,
        max: analysis.maxScore ?? 0,
        sum: analysis.sumScore ?? 0,
        avg: analysis.avgScore ?? 0,
        median: analysis.medianScore ?? 0,
      }
    }

    // 兜底提取并计算
    let sum = 0
    let totalCount = 0
    let min = Infinity
    let max = -Infinity
    const allScores: number[] = []

    analysis.distribution.forEach((d) => {
      // 若是区间标签如 "1-7"，取其中间值或最小值作为统计源
      let val = Number(d.score)
      if (Number.isNaN(val)) {
        const parts = String(d.score).split('-').map(Number)
        if (parts.length === 2 && !parts.some(Number.isNaN)) {
          val = (parts[0] + parts[1]) / 2
        } else {
          val = 0
        }
      }

      sum += val * d.count
      totalCount += d.count
      if (val < min) min = val
      if (val > max) max = val
      for (let i = 0; i < d.count; i++) {
        allScores.push(val)
      }
    })

    allScores.sort((a, b) => a - b)
    let median = 0
    if (allScores.length > 0) {
      const mid = Math.floor(allScores.length / 2)
      median =
        allScores.length % 2 !== 0
          ? allScores[mid]
          : (allScores[mid - 1] + allScores[mid]) / 2
    }

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      sum: Number(sum.toFixed(2)),
      avg: totalCount > 0 ? Number((sum / totalCount).toFixed(2)) : 0,
      median: Number(median.toFixed(2)),
    }
  }, [analysis])

  const chartData = React.useMemo(() => {
    return analysis.distribution.map((dist) => ({
      name: String(dist.score),
      数量: dist.count,
      比例: (dist.percentage * 100).toFixed(1) + '%',
    }))
  }, [analysis.distribution])

  const statItems = [
    {
      title: '平均值 (Average)',
      value: stats.avg,
      icon: TrendingUp,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: '中位数 (Median)',
      value: stats.median,
      icon: Calculator,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: '最大值 (Max)',
      value: stats.max,
      icon: ArrowUpRight,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: '最小值 (Min)',
      value: stats.min,
      icon: ArrowDownRight,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: '累计总和 (Sum)',
      value: stats.sum,
      icon: PlusCircle,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ]

  return (
    <div className='space-y-6'>
      {/* 科技感统计指标卡片网格 */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
        {statItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className='flex flex-col justify-between p-3.5 rounded-xl border border-muted/80 bg-muted/5 shadow-sm hover:shadow transition-all duration-200'
            >
              <div className='flex items-center justify-between gap-2 text-muted-foreground'>
                <span className='text-[10px] sm:text-xs font-medium truncate'>
                  {item.title}
                </span>
                <span className={`p-1 rounded-lg border shrink-0 ${item.color}`}>
                  <Icon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                </span>
              </div>
              <div className='mt-2.5 text-xl sm:text-2xl font-bold tracking-tight font-mono text-foreground'>
                {item.value}
              </div>
            </div>
          )
        })}
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* 数据分布明细列表 */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground'>
              分值分布明细
            </span>
          </div>
          <div className='space-y-2.5 max-h-[220px] overflow-y-auto pr-1 border border-muted/20 rounded-xl p-3 bg-muted/5'>
            {analysis.distribution.map((dist, i) => (
              <div key={i} className='space-y-1.5'>
                <div className='flex items-center justify-between text-xs gap-4'>
                  <span className='font-semibold text-foreground font-mono'>
                    {dist.score}
                  </span>
                  <div className='flex items-center gap-2 shrink-0 text-muted-foreground'>
                    <span className='font-mono font-medium text-foreground'>
                      {dist.count} 人
                    </span>
                    <span className='font-mono w-12 text-right'>
                      {(dist.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={dist.percentage * 100}
                  className='h-1.5 bg-muted/60'
                />
              </div>
            ))}
          </div>
        </div>

        {/* 统计图表可视化 */}
        <div className='flex flex-col border border-muted/80 rounded-xl p-4 bg-muted/5 relative min-h-[260px] justify-between'>
          <div className='flex items-center justify-between mb-4 border-b border-muted/50 pb-2.5'>
            <span className='text-xs font-semibold text-muted-foreground'>
              分布趋势可视化
            </span>
            <div className='flex items-center bg-muted/60 p-0.5 rounded-lg border border-muted/80 text-[11px] shrink-0'>
              <Button
                variant='ghost'
                className={`h-6 px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all ${
                  chartType === 'bar'
                    ? 'bg-background shadow-sm text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setChartType('bar')}
              >
                <BarChart2 className='h-3.5 w-3.5' />
                柱状图
              </Button>
              <Button
                variant='ghost'
                className={`h-6 px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all ${
                  chartType === 'line'
                    ? 'bg-background shadow-sm text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setChartType('line')}
              >
                <Activity className='h-3.5 w-3.5' />
                折线图
              </Button>
            </div>
          </div>

          <div className='h-[170px] w-full flex items-center justify-center'>
            <ResponsiveContainer width='100%' height='100%'>
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                          <div className='bg-background rounded-lg border p-2.5 shadow-md text-xs space-y-1'>
                            <div className='font-semibold'>数值: {item.name}</div>
                            <div className='flex items-center gap-4 text-muted-foreground'>
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
                  <Bar
                    dataKey='数量'
                    fill='currentColor'
                    radius={[4, 4, 0, 0]}
                    className='fill-primary/95 shadow-sm'
                    barSize={
                      chartData.length > 20
                        ? 8
                        : chartData.length > 10
                        ? 16
                        : 24
                    }
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                          <div className='bg-background rounded-lg border p-2.5 shadow-md text-xs space-y-1'>
                            <div className='font-semibold'>数值: {item.name}</div>
                            <div className='flex items-center gap-4 text-muted-foreground'>
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
                  <Line
                    type='monotone'
                    dataKey='数量'
                    stroke='var(--primary)'
                    strokeWidth={2}
                    activeDot={{ r: 5 }}
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
