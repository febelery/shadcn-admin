import React from 'react'
import type { ChoiceAnalysis } from '@/features/survey/core/analysis-types'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Progress } from '@/components/ui/progress'

interface ChoiceChartProps {
  analysis: ChoiceAnalysis
}

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'oklch(0.60 0.15 150)', // 绿色系
  'oklch(0.65 0.13 310)', // 紫色系
  'oklch(0.68 0.16 45)',  // 橙色系
  'oklch(0.72 0.11 200)', // 青色系
  'oklch(0.50 0.12 260)', // 靛蓝色系
]

export function ChoiceChart({ analysis }: ChoiceChartProps) {
  const data = React.useMemo(() => {
    return analysis.options.map((opt) => ({
      name: opt.label,
      数量: opt.count,
      比例: (opt.percentage * 100).toFixed(1) + '%',
    }))
  }, [analysis.options])

  // 选项数量较少（<= 10）时采用环形饼图（Donut Chart），以避免右侧条形图与左侧进度条在视觉上过于相似
  const isPieChart = React.useMemo(() => {
    return analysis.options.length <= 10
  }, [analysis.options])

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* 左侧选项列表数据列表 */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-4 text-xs text-muted-foreground font-medium'>
          <span>选项统计数据</span>
        </div>
        <div className='space-y-3.5'>
          {analysis.options.map((opt, i) => (
            <div key={i} className='space-y-1.5'>
              <div className='flex items-center justify-between text-sm gap-4'>
                <span className='font-medium text-foreground wrap-break-word line-clamp-2 flex-1 flex items-center gap-2'>
                  {isPieChart && (
                    <span
                      className='h-2.5 w-2.5 rounded-full shrink-0'
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  )}
                  {opt.label}
                </span>
                <div className='flex items-center gap-2.5 shrink-0 text-muted-foreground text-xs'>
                  <span className='font-mono font-medium text-foreground'>{opt.count} 票</span>
                  <span className='font-mono w-12 text-right'>{(opt.percentage * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={opt.percentage * 100} className='h-2 bg-muted/60' />
            </div>
          ))}
        </div>
      </div>

      {/* 右侧图形可视化 */}
      <div className='h-[220px] md:h-full min-h-[220px] flex items-center justify-center bg-muted/5 rounded-xl border p-3 border-dashed'>
        <ResponsiveContainer width='100%' height='100%'>
          {isPieChart ? (
            <PieChart>
              <Pie
                data={data}
                dataKey='数量'
                nameKey='name'
                cx='50%'
                cy='45%'
                // 微调内外半径，为外部渲染标签文字留出足够空间，避免遮挡
                innerRadius={36}
                outerRadius={55}
                paddingAngle={3}
                // 直接渲染各扇区的文案（显示选项名称缩写与占比），无需鼠标悬停。使用 any 绕过 Recharts 内置 PieLabelRenderProps 缺少自定义字段的类型限制。
                labelLine={true}
                label={(props: any) => {
                  const name = props.name ?? ''
                  const ratio = props.比例 ?? ''
                  const displayName = name.length > 6 ? `${name.slice(0, 6)}...` : name
                  return `${displayName} (${ratio})`
                }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    return (
                      <div className='bg-background rounded-lg border p-2.5 shadow-md text-xs space-y-1 border-muted/80'>
                        <div className='font-semibold max-w-[200px] truncate'>{item.name}</div>
                        <div className='flex items-center gap-4 text-muted-foreground'>
                          <span>票数: <strong className='text-foreground'>{item.数量}</strong></span>
                          <span>比例: <strong className='text-foreground'>{item.比例}</strong></span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                layout='horizontal'
                verticalAlign='bottom'
                align='center'
                iconType='circle'
                iconSize={7}
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
              />
            </PieChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
            >
              {/* 隐藏 XAxis 以免过多文字拥挤，仅通过 Tooltip 展示对应选项名称 */}
              <XAxis dataKey='name' hide={true} />
              <YAxis
                type='number'
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
                      <div className='bg-background rounded-lg border p-2.5 shadow-md text-xs space-y-1 border-muted/80'>
                        <div className='font-semibold max-w-[200px] truncate'>{item.name}</div>
                        <div className='flex items-center gap-4 text-muted-foreground'>
                          <span>票数: <strong className='text-foreground'>{item.数量}</strong></span>
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
                className='fill-primary/90'
                barSize={20}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

