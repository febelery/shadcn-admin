import { Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 题型出口定义
 */
export const dateType = defineQuestion({
  type: 'date',
  meta: {
    label: '选择日期',
    description: '时间点采集',
    icon: CalendarIcon,
    category: '输入类',
  },
  validationTypes: ['date_range'],
  create: () => ({
    type: 'date',
    title: '请选择日期',
    required: false,
    config: {
      placeholder: '请选择日期...',
      minDate: undefined,
      maxDate: undefined,
      showTime: false,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='flex items-center gap-3 p-4 font-sans opacity-50'>
        <div className='border-muted-foreground/30 flex h-8 flex-1 items-center justify-between rounded-md border px-3'>
          <span className='text-muted-foreground/40 truncate text-xs'>
            {node.config.placeholder || '年 / 月 / 日'}
          </span>
          <CalendarIcon className='text-muted-foreground/20 h-3 w-3 shrink-0' />
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
      <div className='space-y-4 p-3 font-sans'>
        {/* 占位提示 */}
        <div className='space-y-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            占位提示
          </label>
          <Input
            className='bg-muted/20 focus-visible:bg-background focus-visible:border-border h-8 border-transparent text-xs shadow-none transition-colors'
            value={config.placeholder || ''}
            placeholder='例如：请选择日期...'
            onChange={(e) => onConfigChange({ placeholder: e.target.value })}
          />
        </div>

        {/* 日期范围约束 */}
        <div className='border-border/40 space-y-3 border-t pt-3'>
          <p className='text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase'>
            日期范围约束
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground pl-0.5 text-[10px]'>
                起始日期
              </label>
              <Input
                type='date'
                className='bg-muted/10 h-7 text-xs shadow-none'
                value={config.minDate || ''}
                onChange={(e) => onConfigChange({ minDate: e.target.value })}
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground pl-0.5 text-[10px]'>
                结束日期
              </label>
              <Input
                type='date'
                className='bg-muted/10 h-7 text-xs shadow-none'
                value={config.maxDate || ''}
                onChange={(e) => onConfigChange({ maxDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 功能开关 */}
        <div className='border-border/40 flex items-center justify-between border-t pt-3'>
          <div className='space-y-0.5'>
            <p className='text-xs font-medium'>包含具体时间</p>
            <p className='text-muted-foreground/60 text-[10px]'>
              允许用户选择具体小时和分钟
            </p>
          </div>
          <Switch
            checked={!!config.showTime}
            onCheckedChange={(v) => onConfigChange({ showTime: v })}
          />
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'date',
    operators: ['eq', 'neq', 'gt', 'lt', 'is_empty', 'is_not_empty'],
  },
})
