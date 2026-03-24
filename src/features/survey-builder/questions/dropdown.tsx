import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOptionsManager } from '../hooks/use-options-manager'
import { defineQuestion, type QuestionComponentProps } from './index'
import { InlineOptionEditor } from './single-choice'

/**
 * 3. 导出定义 (收敛版)
 */
export const dropdownType = defineQuestion({
  type: 'dropdown',
  meta: {
    label: '下拉选择',
    description: '下拉菜单形式选择',
    icon: ChevronDown,
    category: '选择类',
  },
  create: () => ({
    type: 'dropdown',
    title: '未命名的下拉选择',
    required: false,
    config: {
      options: [
        { id: crypto.randomUUID(), label: '选项 1', value: 'opt_1', order: 0 },
        { id: crypto.randomUUID(), label: '选项 2', value: 'opt_2', order: 1 },
      ],
    },
  }),
  preview: function Preview() {
    return (
      <div className='border-muted-foreground/20 flex items-center justify-between rounded-md border-2 p-3 opacity-60'>
        <span className='text-muted-foreground text-sm'>请选择一项...</span>
        <ChevronDown className='text-muted-foreground/50 h-4 w-4' />
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

    return (
      <div className='space-y-4 p-3 font-sans'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>下拉项列表</span>
          <Badge
            variant='secondary'
            className='h-4 px-1.5 font-mono shadow-none'
          >
            {options.length}
          </Badge>
        </div>

        <div className='space-y-2'>
          {options.map((opt, i) => (
            <div key={opt.id} className='group flex items-center gap-2'>
              <Input
                className='bg-muted/20 focus-visible:bg-background focus-visible:border-border h-8 flex-1 border-transparent px-2 text-xs shadow-none'
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
          className='text-muted-foreground hover:bg-muted/30 h-8 w-full border-dashed text-xs shadow-none'
        >
          <Plus className='mr-1.5 h-3 w-3' /> 添加下拉项
        </Button>
      </div>
    )
  },
  editor: InlineOptionEditor,
  capabilities: {
    valueType: 'string',
    operators: ['eq', 'neq', 'is_empty', 'is_not_empty'],
  },
})
