import { BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * NPS 颜色分档逻辑
 */
const getScoreColor = (score: number) => {
  if (score <= 6) return 'bg-destructive/15 text-destructive/70'
  if (score <= 8) return 'bg-amber-400/15 text-amber-600/80'
  return 'bg-emerald-500/15 text-emerald-600/80'
}

/**
 * 3. 题型组件导出
 */
export const npsType = defineQuestion({
  type: 'nps',
  meta: {
    label: 'NPS',
    description: '净推荐值调研 0–10',
    icon: BarChart2,
    category: '评价类',
  },
  create: () => ({
    type: 'nps',
    title: '您有多大意愿向朋友推荐我们的产品？',
    required: false,
    config: {
      lowLabel: '极不推荐',
      highLabel: '极力推荐',
      showLabels: true,
      scaleStart: 0,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const range = Array.from({ length: 11 }, (_, i) => i)
    return (
      <div className='pointer-events-none flex flex-col gap-2 p-4 opacity-70'>
        <div className='flex gap-0.5'>
          {range.map((v) => (
            <div
              key={v}
              className={cn(
                'flex h-6 flex-1 items-center justify-center rounded font-mono text-[10px] font-bold',
                getScoreColor(v)
              )}
            >
              {v}
            </div>
          ))}
        </div>
        <div className='text-muted-foreground/50 flex justify-between px-0.5 text-[10px] italic'>
          <span>{node.config.lowLabel || '极不推荐'}</span>
          <span>{node.config.highLabel || '极力推荐'}</span>
        </div>
      </div>
    )
  },
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const config = node.config as any

    return (
      <div className='flex flex-col gap-5 p-3 font-sans'>
        {/* 标签设置 */}
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
              端点标签
            </label>
            <Switch
              checked={config.showLabels !== false}
              onCheckedChange={(v) => onConfigChange({ showLabels: v })}
            />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-muted-foreground text-[10px]'>
                极差端
              </label>
              <Input
                className='h-7 text-xs shadow-none'
                value={config.lowLabel || ''}
                placeholder='极不推荐'
                onChange={(e) => onConfigChange({ lowLabel: e.target.value })}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-muted-foreground text-[10px]'>
                极佳端
              </label>
              <Input
                className='h-7 text-xs shadow-none'
                value={config.highLabel || ''}
                placeholder='极力推荐'
                onChange={(e) => onConfigChange({ highLabel: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 分段标签 */}
        <div className='border-border/40 flex flex-col gap-3 border-t pt-3'>
          <label className='text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase'>
            分段描述 (可选)
          </label>
          <div className='flex flex-col gap-1.5'>
            <Input
              className='bg-muted/20 hover:bg-muted/40 h-7 border-transparent text-xs shadow-none transition-colors'
              value={config.detractorLabel || ''}
              placeholder='批评者 (0–6)'
              onChange={(e) =>
                onConfigChange({ detractorLabel: e.target.value })
              }
            />
            <Input
              className='bg-muted/20 hover:bg-muted/40 h-7 border-transparent text-xs shadow-none transition-colors'
              value={config.passiveLabel || ''}
              placeholder='中立者 (7–8)'
              onChange={(e) => onConfigChange({ passiveLabel: e.target.value })}
            />
            <Input
              className='bg-muted/20 hover:bg-muted/40 h-7 border-transparent text-xs shadow-none transition-colors'
              value={config.promoterLabel || ''}
              placeholder='推荐者 (9–10)'
              onChange={(e) =>
                onConfigChange({ promoterLabel: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    )
  },
  editor: function Editor({ node, onConfigChange }: QuestionComponentProps) {
    const lowLabel = node.config.lowLabel || '极不推荐'
    const highLabel = node.config.highLabel || '极力推荐'

    // 根据 scaleStart 决定显示 0–10 还是 1–10
    const scaleStart = (node.config as any).scaleStart ?? 0
    const range = Array.from(
      { length: scaleStart === 0 ? 11 : 10 },
      (_, i) => i + scaleStart
    )

    const getColorClass = (v: number) => {
      const threshold6 = 6
      const threshold8 = 8
      if (v <= threshold6) return 'bg-destructive/10 text-destructive/80'
      if (v <= threshold8) return 'bg-chart-5/15 text-chart-5/80'
      return 'bg-chart-2/15 text-chart-2/80'
    }

    return (
      <div className='flex flex-col gap-4 p-2 font-sans'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-0.5'>
            {range.map((v) => (
              <div
                key={v}
                className={cn(
                  'flex flex-1 items-center justify-center rounded py-1 font-mono text-[10px] font-semibold shadow-none transition-all',
                  getColorClass(v)
                )}
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase'>
              左侧标签 ({scaleStart} 分)
            </span>
            <textarea
              className='bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/40 h-10 w-full resize-none rounded-lg border p-2 text-xs shadow-none transition-all outline-none'
              value={lowLabel}
              onChange={(e) => onConfigChange({ lowLabel: e.target.value })}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <span className='text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase'>
              右侧标签 (10 分)
            </span>
            <textarea
              className='bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/40 h-10 w-full resize-none rounded-lg border p-2 text-right text-xs shadow-none transition-all outline-none'
              value={highLabel}
              onChange={(e) => onConfigChange({ highLabel: e.target.value })}
            />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'number',
    operators: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'],
  },
})
