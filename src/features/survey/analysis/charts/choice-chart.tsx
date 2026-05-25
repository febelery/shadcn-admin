import React from 'react'
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  Treemap,
} from 'recharts'
import { Progress } from '@/components/ui/progress'
import type { ChoiceAnalysis } from '@/features/survey/core/analysis-types'

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
  'oklch(0.68 0.16 45)', // 橙色系
  'oklch(0.72 0.11 200)', // 青色系
  'oklch(0.50 0.12 260)', // 靛蓝色系
]

/**
 * Treemap 自定义渲染节点组件
 */
function CustomizedTreemapContent(props: any) {
  const { x, y, width, height, index, name, 比例, depth } = props
  if (depth !== 1) return null
  if (width < 30 || height < 20) return null

  const color = PIE_COLORS[index % PIE_COLORS.length]

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: '#fff',
          strokeWidth: 1.5,
          opacity: 0.85,
        }}
      />
      {width > 65 && height > 32 ? (
        <>
          <text
            x={x + 6}
            y={y + 18}
            fill='#fff'
            fontSize={10}
            fontWeight='600'
            className='select-none'
          >
            {name.length > 8 ? `${name.slice(0, 8)}...` : name}
          </text>
          <text
            x={x + 6}
            y={y + 31}
            fill='#ffffffb0'
            fontSize={9}
            fontWeight='500'
            className='select-none'
          >
            {比例}
          </text>
        </>
      ) : width > 40 && height > 20 ? (
        <text
          x={x + 4}
          y={y + 14}
          fill='#fff'
          fontSize={8}
          fontWeight='500'
          className='select-none'
        >
          {比例}
        </text>
      ) : null}
    </g>
  )
}

export function ChoiceChart({ analysis }: ChoiceChartProps) {
  const data = React.useMemo(() => {
    return analysis.options.map((opt) => ({
      name: opt.label,
      数量: opt.count,
      比例: (opt.percentage * 100).toFixed(1) + '%',
    }))
  }, [analysis.options])

  const optionCount = analysis.options.length

  const renderVisualChart = () => {
    // 选项数量：<= 8 渲染 Donut 环形图；> 8 渲染 Treemap 矩形树图
    if (optionCount <= 8) {
      // 1. Donut Chart：关闭自带文字连线标签，通过 Tooltip 与底部 Legend 配合，保持 100% 干净清爽
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey='数量'
            nameKey='name'
            cx='50%'
            cy='45%'
            innerRadius={36}
            outerRadius={55}
            paddingAngle={3}
            labelLine={false}
            label={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className='bg-background border-muted/80 space-y-1 rounded-lg border p-2.5 text-xs shadow-md'>
                    <div className='max-w-[200px] truncate font-semibold'>
                      {item.name}
                    </div>
                    <div className='text-muted-foreground flex items-center gap-4'>
                      <span>
                        票数:{' '}
                        <strong className='text-foreground'>{item.数量}</strong>
                      </span>
                      <span>
                        比例:{' '}
                        <strong className='text-foreground'>{item.比例}</strong>
                      </span>
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
      )
    } else {
      // 2. Treemap 矩形树图：大基数选项（>8）的完美可视化方式，避免饼图文字连线遮挡和雷达图零值坍缩
      const treemapData = analysis.options.map((opt) => ({
        name: opt.label,
        size: opt.count || 0.1, // 确保大小始终为正值以进行正确布局，0票用0.1占位
        数量: opt.count,
        比例: (opt.percentage * 100).toFixed(1) + '%',
      }))

      return (
        <Treemap
          data={treemapData}
          dataKey='size'
          aspectRatio={4 / 3}
          stroke='#fff'
          content={<CustomizedTreemapContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className='bg-background border-muted/80 space-y-1 rounded-lg border p-2.5 text-xs shadow-md'>
                    <div className='max-w-[200px] truncate font-semibold'>
                      {item.name}
                    </div>
                    <div className='text-muted-foreground flex items-center gap-4'>
                      <span>
                        票数:{' '}
                        <strong className='text-foreground'>{item.数量}</strong>
                      </span>
                      <span>
                        比例:{' '}
                        <strong className='text-foreground'>{item.比例}</strong>
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
        </Treemap>
      )
    }
  }

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* 左侧选项列表数据列表 */}
      <div className='space-y-4'>
        <div className='text-muted-foreground flex items-center justify-between gap-4 text-xs font-medium'>
          <span>选项统计数据</span>
        </div>
        <div className='space-y-3.5'>
          {analysis.options.map((opt, i) => (
            <div key={i} className='space-y-1.5'>
              <div className='flex items-center justify-between gap-4 text-sm'>
                <span className='text-foreground line-clamp-2 flex flex-1 items-center gap-2 font-medium wrap-break-word'>
                  {optionCount <= 8 && (
                    <span
                      className='h-2.5 w-2.5 shrink-0 rounded-full'
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  )}
                  {opt.label}
                </span>
                <div className='text-muted-foreground flex shrink-0 items-center gap-2.5 text-xs'>
                  <span className='text-foreground font-mono font-medium'>
                    {opt.count} 票
                  </span>
                  <span className='w-12 text-right font-mono'>
                    {(opt.percentage * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress
                value={opt.percentage * 100}
                className='bg-muted/60 h-2'
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右侧图形可视化 */}
      <div className='bg-muted/5 flex h-[220px] min-h-[220px] items-center justify-center rounded-xl border border-dashed p-3 md:h-full'>
        <ResponsiveContainer width='100%' height='100%'>
          {renderVisualChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
