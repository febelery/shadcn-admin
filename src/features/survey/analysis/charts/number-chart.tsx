import React from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  PlusCircle,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Progress } from '@/components/ui/progress'
import type { NumericAnalysis } from '@/features/survey/core/analysis-types'

interface NumberChartProps {
  analysis: NumericAnalysis
}

export function NumberChart({ analysis }: NumberChartProps) {
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
    const scoreFreqs: { val: number; count: number }[] = []

    analysis.distribution.forEach((d) => {
      // 若是区间标签如 "1-7"，取其中间值作为统计源
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

      scoreFreqs.push({ val, count: d.count })
    })

    // 按分值从小到大排序
    scoreFreqs.sort((a, b) => a.val - b.val)

    let median = 0
    if (totalCount > 0) {
      const mid1 = Math.floor((totalCount - 1) / 2)
      const mid2 = Math.floor(totalCount / 2)

      let runningSum = 0
      let val1: number | null = null
      let val2: number | null = null

      for (const item of scoreFreqs) {
        runningSum += item.count
        if (val1 === null && runningSum > mid1) {
          val1 = item.val
        }
        if (val2 === null && runningSum > mid2) {
          val2 = item.val
        }
        if (val1 !== null && val2 !== null) {
          break
        }
      }
      median = ((val1 ?? 0) + (val2 ?? 0)) / 2
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
      <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
        {statItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className='border-muted/80 bg-muted/5 flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all duration-200 hover:shadow'
            >
              <div className='text-muted-foreground flex items-center justify-between gap-2'>
                <span className='truncate text-[10px] font-medium sm:text-xs'>
                  {item.title}
                </span>
                <span
                  className={`shrink-0 rounded-lg border p-1 ${item.color}`}
                >
                  <Icon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                </span>
              </div>
              <div className='text-foreground mt-2.5 font-mono text-xl font-bold tracking-tight sm:text-2xl'>
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
            <span className='text-muted-foreground text-xs font-semibold'>
              分值分布明细
            </span>
          </div>
          <div className='border-muted/20 bg-muted/5 max-h-[220px] space-y-2.5 overflow-y-auto rounded-xl border p-3 pr-1'>
            {analysis.distribution.map((dist, i) => (
              <div key={i} className='space-y-1.5'>
                <div className='flex items-center justify-between gap-4 text-xs'>
                  <span className='text-foreground font-mono font-semibold'>
                    {dist.score}
                  </span>
                  <div className='text-muted-foreground flex shrink-0 items-center gap-2'>
                    <span className='text-foreground font-mono font-medium'>
                      {dist.count} 人
                    </span>
                    <span className='w-12 text-right font-mono'>
                      {(dist.percentage * 100).toFixed(1)}%
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

        {/* 统计图表可视化 */}
        <div className='border-muted/80 bg-muted/5 relative flex min-h-[260px] flex-col justify-between rounded-xl border p-4'>
          <div className='border-muted/50 mb-4 flex items-center justify-between border-b pb-2.5'>
            <span className='text-muted-foreground text-xs font-semibold'>
              分布趋势可视化
            </span>
          </div>

          <div className='flex h-[170px] w-full items-center justify-center'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id='colorNumber' x1='0' y1='0' x2='0' y2='1'>
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
                          <div className='font-semibold'>数值: {item.name}</div>
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
                  fill='url(#colorNumber)'
                  activeDot={{ r: 5 }}
                  dot={{ r: 3, strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
