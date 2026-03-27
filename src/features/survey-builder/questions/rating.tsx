import { Circle, Heart, Star, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 题型出口定义
 */
export const ratingType = defineQuestion({
  type: 'rating',
  meta: {
    label: '评分',
    description: '1–5 星评价或自定义',
    icon: Star,
    category: '评价类',
  },
  create: () => ({
    type: 'rating',
    title: '请为我们的服务评分',
    required: false,
    config: {
      starCount: 5,
      starShape: 'star',
      allowHalf: false,
      showNumbers: false,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const count = node.config.starCount || 5
    const stars = Array.from({ length: count })
    return (
      <div className='flex items-center gap-1 p-4 opacity-60'>
        {stars.map((_, i) => (
          <Star
            key={i}
            className='fill-muted-foreground/20 text-muted-foreground/30 h-5 w-5 border-none shadow-none'
          />
        ))}
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
        {/* 评分级数 */}
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
              评分级数
            </label>
            <span className='bg-secondary rounded px-1.5 font-mono text-xs shadow-none'>
              {config.starCount || 5}
            </span>
          </div>
          <Slider
            defaultValue={[5]}
            value={[config.starCount || 5]}
            min={2}
            max={10}
            step={1}
            onValueChange={([val]) => onConfigChange({ starCount: val })}
          />
        </div>

        {/* 标签设置 */}
        <div className='border-border/40 grid grid-cols-2 gap-2 border-t pt-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>
              低分标签
            </label>
            <Input
              className='h-7 text-xs shadow-none'
              value={config.lowLabel || ''}
              placeholder='非常差'
              onChange={(e) => onConfigChange({ lowLabel: e.target.value })}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>
              高分标签
            </label>
            <Input
              className='h-7 text-xs shadow-none'
              value={config.highLabel || ''}
              placeholder='非常好'
              onChange={(e) => onConfigChange({ highLabel: e.target.value })}
            />
          </div>
        </div>

        {/* 其他开关 */}
        <div className='border-border/40 flex flex-col gap-3 border-t pt-3'>
          <div className='flex items-center justify-between'>
            <div className='flex flex-col gap-0.5'>
              <p className='text-xs font-medium'>允许半星</p>
              <p className='text-muted-foreground/60 text-[10px]'>
                支持 0.5 分采集
              </p>
            </div>
            <Switch
              checked={!!config.allowHalf}
              onCheckedChange={(v) => onConfigChange({ allowHalf: v })}
            />
          </div>
        </div>
      </div>
    )
  },
  editor: function Editor({ node, onConfigChange }: QuestionComponentProps) {
    const count = node.config.starCount ?? 5
    const shape = node.config.starShape ?? 'star'

    const handleUpdateCount = (newCount: number) => {
      onConfigChange({
        starCount: Math.max(1, Math.min(10, newCount)),
      })
    }

    const renderIcon = (shape: string) => {
      const IconProps = { className: 'size-4' }
      switch (shape) {
        case 'heart':
          return <Heart {...IconProps} />
        case 'thumb':
          return <ThumbsUp {...IconProps} />
        case 'circle':
          return <Circle {...IconProps} />
        case 'star':
        default:
          return <Star {...IconProps} />
      }
    }

    return (
      <div className='flex flex-col gap-2 p-2'>
        <div className='flex items-center gap-1.5'>
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleUpdateCount(i + 1)}
              className={cn(
                'flex size-6 items-center justify-center border-none shadow-none ring-0 transition-all outline-none hover:scale-110',
                i < count ? 'text-foreground' : 'text-muted-foreground/15'
              )}
            >
              {renderIcon(shape)}
            </button>
          ))}
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'number',
    operators: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'],
  },
})
