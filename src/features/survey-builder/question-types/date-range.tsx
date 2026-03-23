import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 题型组件定义 (date_range)
 */
export const dateRangeType: QuestionTypeDefinition = {
  type: 'date_range',
  meta: {
    label: '时间跨度',
    description: '选择开始与结束日期',
    icon: CalendarIcon,
    category: '输入类',
  },
  create: () => ({
    type: 'date_range',
    title: '请选择起止日期范围',
    required: false,
    config: {
      placeholder: '开始日期',
      endPlaceholder: '结束日期',
      minDate: undefined,
      maxDate: undefined,
      showTime: false,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='flex items-center gap-2 p-4 opacity-60'>
        <div className='border-muted-foreground/20 flex flex-1 items-center justify-between rounded-md border-2 p-2'>
          <span className='text-muted-foreground truncate text-[10px]'>
            {node.config.placeholder || '开始日期'}
          </span>
          <CalendarIcon className='text-muted-foreground/40 h-3 w-3' />
        </div>
        <ArrowRight className='text-muted-foreground/30 h-3.5 w-3.5 shrink-0' />
        <div className='border-muted-foreground/20 flex flex-1 items-center justify-between rounded-md border-2 p-2'>
          <span className='text-muted-foreground truncate text-[10px]'>
            {node.config.endPlaceholder || '结束日期'}
          </span>
          <CalendarIcon className='text-muted-foreground/40 h-3 w-3' />
        </div>
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const config = node.config as any

    return (
      <div className='space-y-4 p-3 font-sans'>
        {/* 占位提示 (双位) */}
        <div className='space-y-3'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            占位提示设置
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <label className='text-muted-foreground px-0.5 text-[9px]'>
                开始位置
              </label>
              <Input
                className='bg-muted/20 focus-visible:bg-background h-7 border-transparent text-[11px] shadow-none'
                value={config.placeholder || ''}
                placeholder='例如：入职时间'
                onChange={(e) =>
                  updateNodeConfig(node.id, { placeholder: e.target.value })
                }
              />
            </div>
            <div className='space-y-1'>
              <label className='text-muted-foreground px-0.5 text-[9px]'>
                结束位置
              </label>
              <Input
                className='bg-muted/20 focus-visible:bg-background h-7 border-transparent text-[11px] shadow-none'
                value={config.endPlaceholder || ''}
                placeholder='例如：离职时间'
                onChange={(e) =>
                  updateNodeConfig(node.id, { endPlaceholder: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* 范围约束 */}
        <div className='border-border/40 space-y-3 border-t pt-3'>
          <p className='text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase'>
            可选择范围限制
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground pl-0.5 text-[10px]'>
                最早界限
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
                最晚界限
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
        <div className='border-border/40 space-y-3 border-t pt-3'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-xs font-medium'>包含具体时间</p>
              <p className='text-muted-foreground/60 text-[10px]'>
                允许范围精确到时分
              </p>
            </div>
            <Switch
              checked={!!config.showTime}
              onCheckedChange={(v) =>
                updateNodeConfig(node.id, { showTime: v })
              }
            />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'date',
    operators: ['eq', 'neq', 'gt', 'lt', 'is_empty', 'is_not_empty'],
  },
}
