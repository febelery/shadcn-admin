import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

// 评分配置组件
export function RatingConfig({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const config = node.config as {
    starCount?: number
    starShape?: 'star' | 'heart' | 'thumb' | 'circle'
    allowHalf?: boolean
    showNumbers?: boolean
    lowLabel?: string
    highLabel?: string
  }

  const starCount = config.starCount ?? 5
  const starShape = config.starShape ?? 'star'

  const shapeMap: Record<string, string> = {
    star: '★',
    heart: '♥',
    thumb: '👍',
    circle: '●',
  }

  return (
    <div className='space-y-4 px-3 pb-2'>
      {/* 评分级数滑动条 */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='text-muted-foreground text-[11px] font-medium'>
            评分级数
          </label>
          <span className='bg-secondary text-foreground rounded px-1.5 py-0.5 font-mono text-xs font-bold'>
            {starCount}
          </span>
        </div>
        <Slider
          defaultValue={[5]}
          value={[starCount]}
          min={2}
          max={10}
          step={1}
          onValueChange={([val]) =>
            updateNodeConfig(node.id, { starCount: val })
          }
        />
        <div className='text-muted-foreground/40 flex justify-between px-0.5 text-[10px]'>
          <span>2</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Shape */}
      <div className='space-y-1.5'>
        <label className='text-muted-foreground text-[11px] font-medium'>
          形状
        </label>
        <div className='grid grid-cols-4 gap-1'>
          {Object.entries(shapeMap).map(([shape, icon]) => (
            <button
              key={shape}
              onClick={() =>
                updateNodeConfig(node.id, { starShape: shape as any })
              }
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md border py-2 text-lg transition-all',
                starShape === shape
                  ? 'border-foreground bg-secondary text-foreground'
                  : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30'
              )}
            >
              <span className='text-base leading-none'>{icon}</span>
              <span className='text-muted-foreground/60 text-[9px]'>
                {
                  {
                    star: '星形',
                    heart: '爱心',
                    thumb: '点赞',
                    circle: '圆形',
                  }[shape]
                }
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-[10px]'>低分标签</label>
          <Input
            className='h-7 text-xs'
            value={config.lowLabel ?? ''}
            placeholder='非常差'
            onChange={(e) =>
              updateNodeConfig(node.id, { lowLabel: e.target.value })
            }
          />
        </div>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-[10px]'>高分标签</label>
          <Input
            className='h-7 text-xs'
            value={config.highLabel ?? ''}
            placeholder='非常好'
            onChange={(e) =>
              updateNodeConfig(node.id, { highLabel: e.target.value })
            }
          />
        </div>
      </div>

      {/* Options */}
      <div className='space-y-2'>
        <div className='border-border/30 flex items-center justify-between border-t py-1'>
          <div>
            <p className='text-foreground text-xs font-medium'>允许半星</p>
            <p className='text-muted-foreground text-[10px]'>可选 0.5 分</p>
          </div>
          <Switch
            checked={!!config.allowHalf}
            onCheckedChange={(v) => updateNodeConfig(node.id, { allowHalf: v })}
          />
        </div>
        <div className='border-border/30 flex items-center justify-between border-t py-1'>
          <div>
            <p className='text-foreground text-xs font-medium'>显示数字</p>
            <p className='text-muted-foreground text-[10px]'>
              在星形旁显示分数
            </p>
          </div>
          <Switch
            checked={!!config.showNumbers}
            onCheckedChange={(v) =>
              updateNodeConfig(node.id, { showNumbers: v })
            }
          />
        </div>
      </div>
    </div>
  )
}

// ── NPS Config ────────────────────────────────────────────
export function NpsConfig({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const config = node.config as {
    lowLabel?: string
    highLabel?: string
    showLabels?: boolean
    scaleStart?: 0 | 1
  }

  const lowLabel = config.lowLabel ?? '极不推荐'
  const highLabel = config.highLabel ?? '极力推荐'
  const showLabels = config.showLabels !== false
  const scaleStart = config.scaleStart ?? 0

  const range = Array.from(
    { length: scaleStart === 0 ? 11 : 10 },
    (_, i) => i + scaleStart
  )

  return (
    <div className='space-y-4 px-3 pb-2'>
      {/* Preview */}
      <div className='space-y-1'>
        <div className='flex gap-0.5'>
          {range.map((v) => (
            <div
              key={v}
              className={cn(
                'flex flex-1 items-center justify-center rounded py-1 font-mono text-[9px] font-bold',
                v <= (scaleStart === 0 ? 6 : 6)
                  ? 'bg-destructive/10 text-destructive/70'
                  : v <= (scaleStart === 0 ? 8 : 8)
                    ? 'bg-chart-5/15 text-chart-5/80'
                    : 'bg-chart-2/15 text-chart-2/80'
              )}
            >
              {v}
            </div>
          ))}
        </div>
        {showLabels && (
          <div className='text-muted-foreground/60 flex justify-between text-[10px]'>
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
          </div>
        )}
      </div>

      {/* Scale start */}
      <div className='space-y-1.5'>
        <label className='text-muted-foreground text-[11px] font-medium'>
          起始刻度
        </label>
        <div className='flex gap-2'>
          {([0, 1] as const).map((v) => (
            <button
              key={v}
              onClick={() => updateNodeConfig(node.id, { scaleStart: v })}
              className={cn(
                'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                scaleStart === v
                  ? 'border-foreground bg-secondary text-foreground'
                  : 'border-border/40 text-muted-foreground hover:border-border'
              )}
            >
              {v === 0 ? '0 – 10' : '1 – 10'}
            </button>
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-[10px]'>
            低分端标签
          </label>
          <Input
            className='h-7 text-xs'
            value={lowLabel}
            placeholder='极不推荐'
            onChange={(e) =>
              updateNodeConfig(node.id, { lowLabel: e.target.value })
            }
          />
        </div>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-[10px]'>
            高分端标签
          </label>
          <Input
            className='h-7 text-xs'
            value={highLabel}
            placeholder='极力推荐'
            onChange={(e) =>
              updateNodeConfig(node.id, { highLabel: e.target.value })
            }
          />
        </div>
      </div>

      {/* Show labels toggle */}
      <div className='border-border/30 flex items-center justify-between border-t py-2'>
        <div>
          <p className='text-foreground text-xs font-medium'>显示端点标签</p>
          <p className='text-muted-foreground text-[10px]'>
            在量表下方显示说明文字
          </p>
        </div>
        <Switch
          checked={showLabels}
          onCheckedChange={(v) => updateNodeConfig(node.id, { showLabels: v })}
        />
      </div>

      {/* Detractor/Passive/Promoter labels */}
      <div className='border-border/30 space-y-2 border-t pt-2'>
        <p className='text-muted-foreground/60 text-[10px] font-semibold tracking-wide uppercase'>
          分段标签（可选）
        </p>
        <div className='space-y-2'>
          {[
            {
              key: 'detractorLabel',
              placeholder: '批评者 (0–6)',
              color: 'text-destructive/70',
            },
            {
              key: 'passiveLabel',
              placeholder: '中立者 (7–8)',
              color: 'text-chart-5/80',
            },
            {
              key: 'promoterLabel',
              placeholder: '推荐者 (9–10)',
              color: 'text-chart-2/80',
            },
          ].map(({ key, placeholder }) => (
            <Input
              key={key}
              className='h-7 text-xs'
              value={(config as any)[key] ?? ''}
              placeholder={placeholder}
              onChange={(e) =>
                updateNodeConfig(node.id, { [key]: e.target.value })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
