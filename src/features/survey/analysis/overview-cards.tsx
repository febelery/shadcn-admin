import React from 'react'
import { FileText, Clock, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SurveyAnalysisOverview } from '@/features/survey/core/analysis-types'

interface OverviewCardsProps {
  overview: SurveyAnalysisOverview
}

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return '0 秒'
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds} 秒`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分`
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const todayCount = React.useMemo(() => {
    if (!overview.dailyTrend || overview.dailyTrend.length === 0) return 0
    return overview.dailyTrend[overview.dailyTrend.length - 1].count
  }, [overview.dailyTrend])

  const stats = [
    {
      title: '总回收记录',
      value: overview.totalRecords,
      description: '问卷已提交的全部有效记录数',
      icon: FileText,
    },
    {
      title: '今日新增回收',
      value: todayCount,
      description: '今天截至目前新增的问卷数',
      icon: TrendingUp,
    },
    {
      title: '平均填写时长',
      value: formatDuration(overview.avgDurationMs),
      description: '单份答卷的平均填写时间',
      icon: Clock,
    },
  ]

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className='border-muted/80 overflow-hidden shadow-sm'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-muted-foreground text-xs font-semibold'>
                  {stat.title}
                </CardTitle>
                <div className='shrink-0 rounded-lg border p-1.5'>
                  <Icon className='h-4 w-4' />
                </div>
              </CardHeader>
              <CardContent className='pt-1'>
                <div className='text-foreground font-mono text-2xl font-bold tracking-tight'>
                  {stat.value}
                </div>
                <p className='text-muted-foreground mt-1 text-[10px]'>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className='border-muted/80 shadow-sm'>
        <CardHeader className='border-muted/50 bg-muted/5 flex flex-row items-center justify-between border-b pb-4'>
          <div className='space-y-1.5'>
            <CardTitle className='flex items-center gap-2 text-sm font-bold'>
              <TrendingUp className='text-primary h-4 w-4' />
              回收趋势
            </CardTitle>
            <p className='text-muted-foreground text-xs'>
              展示最近 30 天内每天的问卷回收走势（包含进行中和已提交记录）
            </p>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='h-[240px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart
                data={overview.dailyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id='colorCount' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='var(--primary)'
                      stopOpacity={0.2}
                    />
                    <stop
                      offset='95%'
                      stopColor='var(--primary)'
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey='date'
                  stroke='#888888'
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(5)} // 只显示 MM-DD
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
                      return (
                        <div className='bg-background space-y-1 rounded-lg border p-2.5 text-xs shadow-md'>
                          <div className='font-semibold'>
                            {payload[0].payload.date}
                          </div>
                          <div className='text-muted-foreground'>
                            回收数:{' '}
                            <strong className='text-foreground font-mono'>
                              {payload[0].value}
                            </strong>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='count'
                  stroke='var(--primary)'
                  strokeWidth={2}
                  fillOpacity={1}
                  fill='url(#colorCount)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
