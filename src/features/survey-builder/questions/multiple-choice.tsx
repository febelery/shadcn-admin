import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOptionsManager } from '../hooks/use-options-manager'
import type { QuestionNode, ChoiceOption } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'
import { InlineOptionEditor } from './single-choice'

/**
 * 题型出口定义
 */
export const multipleChoiceType = defineQuestion({
  type: 'multiple_choice',
  meta: {
    label: '多选题',
    description: '可选择一个或多个选项',
    icon: CheckSquare,
    category: '选择类',
  },
  create: () => ({
    type: 'multiple_choice',
    title: '未命名的多选题',
    required: false,
    config: {
      options: [
        { id: crypto.randomUUID(), label: '选项 1', value: 'opt_1', order: 0 },
        { id: crypto.randomUUID(), label: '选项 2', value: 'opt_2', order: 1 },
      ],
      minSelect: undefined,
      maxSelect: undefined,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const options = (node.config.options || []) as ChoiceOption[]
    return (
      <div className='flex flex-col gap-2 p-4 opacity-70'>
        {options.slice(0, 3).map((opt) => (
          <div key={opt.id} className='flex items-center gap-3'>
            <div className='border-muted-foreground/30 h-4 w-4 rounded-sm border-2' />
            <span className='text-muted-foreground text-sm'>
              {opt.label || '新多选项'}
            </span>
          </div>
        ))}
        {options.length > 3 && (
          <div className='text-muted-foreground/50 pl-7 text-[10px] italic'>
            ...等 {options.length} 个多选项
          </div>
        )}
      </div>
    )
  },
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const { options, addOption, removeOption, updateLabel } = useOptionsManager(
      node,
      onConfigChange
    )
    const config = node.config as any

    return (
      <div className='flex flex-col gap-4 p-3'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>多选选项列表</span>
          <Badge
            variant='secondary'
            className='h-4 px-1.5 font-mono shadow-none'
          >
            {options.length}
          </Badge>
        </div>

        {/* 选项增删改区域 */}
        <div className='flex flex-col gap-2'>
          {options.map((opt, i) => (
            <div key={opt.id} className='group flex items-center gap-2'>
              <div className='text-muted-foreground/30 w-3 font-mono text-[10px]'>
                {i + 1}
              </div>
              <Input
                className='bg-muted/20 focus-visible:bg-background focus-visible:border-border h-8 flex-1 border-transparent px-2 text-xs shadow-none transition-colors'
                value={opt.label}
                onChange={(e) => updateLabel(opt.id, e.target.value)}
                placeholder={`选项 ${i + 1}`}
              />
              <button
                onClick={() => removeOption(opt.id)}
                className='text-muted-foreground/20 hover:text-destructive p-1.5 opacity-0 transition-all group-hover:opacity-100'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => addOption()}
          className='text-muted-foreground border-border/60 hover:bg-muted/30 h-8 w-full border-dashed text-xs shadow-none'
        >
          <Plus className='mr-1.5 h-3 w-3' /> 添加选项
        </Button>

        {/* 特有属性：多选题的数量限制 */}
        <div className='border-border/40 border-t pt-3'>
          <p className='text-muted-foreground/60 mb-3 text-[10px] font-bold tracking-widest uppercase'>
            选择限制
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-muted-foreground pl-0.5 text-[10px]'>
                最少选(项)
              </label>
              <Input
                type='number'
                min={1}
                className='h-7 text-xs shadow-none'
                value={config.minSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  onConfigChange({
                    minSelect: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-muted-foreground pl-0.5 text-[10px]'>
                最多选(项)
              </label>
              <Input
                type='number'
                min={1}
                className='h-7 text-xs shadow-none'
                value={config.maxSelect ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  onConfigChange({
                    maxSelect: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
  editor: InlineOptionEditor,
  capabilities: {
    valueType: 'array',
    operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  },
})
