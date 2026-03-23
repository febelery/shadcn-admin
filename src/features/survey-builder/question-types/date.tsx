import { Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 题型出口定义
 */
export const dateType: QuestionTypeDefinition = {
  type: 'date',
  meta: {
    label: '日期',
    description: '日期选择器',
    icon: CalendarIcon,
    category: '输入类',
  },
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
      <div className='border-muted-foreground/20 flex items-center justify-between rounded-md border-2 p-3 opacity-60'>
        <span className='text-muted-foreground text-sm'>
          {node.config.placeholder || '请选择日期...'}
        </span>
        <CalendarIcon className='text-muted-foreground/50 h-4 w-4' />
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
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
            placeholder='例如：请选择入职日期'
            onChange={(e) =>
              updateNodeConfig(node.id, { placeholder: e.target.value })
            }
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
                onChange={(e) =>
                  updateNodeConfig(node.id, { minDate: e.target.value })
                }
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
                onChange={(e) =>
                  updateNodeConfig(node.id, { maxDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* 功能开关 */}
        <div className='border-border/40 flex items-center justify-between border-t pt-3'>
          <div className='space-y-0.5'>
            <p className='text-xs font-medium'>包含时间</p>
            <p className='text-muted-foreground/60 text-[10px]'>
              允许用户选择具体小时和分钟
            </p>
          </div>
          <Switch
            checked={!!config.showTime}
            onCheckedChange={(v) => updateNodeConfig(node.id, { showTime: v })}
          />
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'date',
    operators: ['eq', 'neq', 'gt', 'lt', 'is_empty', 'is_not_empty'],
  },
}
