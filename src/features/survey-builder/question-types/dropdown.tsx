import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBuilderStore } from '@/features/survey-builder/store'
import { InlineOptionEditor } from '../components/editors/choice-editor'
import type { QuestionNode, ChoiceOption } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 导出定义 (收敛版)
 */
export const dropdownType: QuestionTypeDefinition = {
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
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const options = (node.config.options || []) as ChoiceOption[]

    const addOption = () => {
      const id = crypto.randomUUID()
      const newOpt: ChoiceOption = {
        id,
        label: '',
        value: `opt_${id.slice(0, 8)}`,
        order: options.length,
      }
      updateNodeConfig(node.id, { options: [...options, newOpt] })
    }

    const removeOption = (id: string) => {
      if (options.length <= 1) return
      updateNodeConfig(node.id, { options: options.filter((o) => o.id !== id) })
    }

    const updateLabel = (id: string, label: string) => {
      updateNodeConfig(node.id, {
        options: options.map((o) => (o.id === id ? { ...o, label } : o)),
      })
    }

    return (
      <div className='space-y-4 p-3'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>下拉项列表</span>
          <Badge variant='secondary' className='h-4 px-1.5 font-mono'>
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
          onClick={addOption}
          className='text-muted-foreground h-8 w-full border-dashed text-xs'
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
}
