import { Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 题型出口定义
 */
export const numberType = defineQuestion({
  type: 'number',
  meta: {
    label: '数字输入',
    description: '数值输入，支持范围校验',
    icon: Hash,
    category: '输入类',
  },
  validationTypes: ['min_value', 'max_value'],
  create: () => ({
    type: 'number',
    title: '请输入数值',
    required: false,
    config: {
      placeholder: '请输入...',
      unit: '',
      showUnit: false,
      minValue: undefined,
      maxValue: undefined,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='flex items-center gap-2 p-4 opacity-50'>
        <div className='border-muted-foreground/20 bg-muted/20 flex h-8 w-24 items-center rounded-md border-2 px-2'>
          <span className='text-muted-foreground/40 font-mono text-xs'>
            123...
          </span>
        </div>
        {node.config.showUnit && (
          <span className='text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5 text-[10px]'>
            {node.config.unit || '单位'}
          </span>
        )}
      </div>
    )
  },
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const config = node.config as any

    return (
      <div className='flex flex-col gap-4 p-3 font-sans'>
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            数字占位符
          </label>
          <Input
            className='h-8 text-xs shadow-none'
            value={config.placeholder || ''}
            placeholder='提示数字...'
            onChange={(e) => onConfigChange({ placeholder: e.target.value })}
          />
        </div>

        <div className='border-border/40 grid grid-cols-2 gap-2 border-t pt-3'>
          <div className='col-span-2 flex flex-col gap-1.5'>
            <label className='text-muted-foreground pl-0.5 text-[11px] font-bold tracking-wider uppercase'>
              单位设置
            </label>
            <div className='flex items-center gap-2'>
              <Input
                className='bg-muted/20 focus-visible:bg-background h-7 flex-1 text-xs shadow-none transition-colors'
                value={config.unit || ''}
                placeholder='单位 (如 元, 次)'
                onChange={(e) =>
                  onConfigChange({
                    unit: e.target.value,
                    showUnit: !!e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>最小值</label>
            <Input
              type='number'
              className='h-7 text-xs shadow-none'
              value={config.minValue || ''}
              placeholder='不限'
              onChange={(e) =>
                onConfigChange({
                  minValue: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>最大值</label>
            <Input
              type='number'
              className='h-7 text-xs shadow-none'
              value={config.maxValue || ''}
              placeholder='不限'
              onChange={(e) =>
                onConfigChange({
                  maxValue: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'number',
    operators: [
      'eq',
      'neq',
      'gt',
      'lt',
      'gte',
      'lte',
      'is_empty',
      'is_not_empty',
    ],
  },
})
