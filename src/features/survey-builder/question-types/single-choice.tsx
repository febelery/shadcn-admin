import { Circle, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBuilderStore } from '@/features/survey-builder/store'
import { InlineOptionEditor } from '../components/editors/choice-editor'
import type { QuestionNode, ChoiceOption } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 题型打包定义
 */
export const singleChoiceType: QuestionTypeDefinition = {
  type: 'single_choice',
  meta: {
    label: '单选题',
    description: '从多个选项中选择一个',
    icon: Circle,
    category: '选择类',
  },
  create: () => ({
    type: 'single_choice',
    title: '未命名的单选题',
    required: false,
    config: {
      options: [
        { id: crypto.randomUUID(), label: '选项 1', value: 'opt_1', order: 0 },
        { id: crypto.randomUUID(), label: '选项 2', value: 'opt_2', order: 1 },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const options = (node.config.options || []) as ChoiceOption[]
    return (
      <div className='flex flex-col gap-2 p-4 opacity-70'>
        {options.slice(0, 3).map((opt) => (
          <div key={opt.id} className='flex items-center gap-3'>
            <div className='border-muted-foreground/30 h-4 w-4 rounded-full border-2' />
            <span className='text-muted-foreground text-sm'>
              {opt.label || '新选项'}
            </span>
          </div>
        ))}
        {options.length > 3 && (
          <div className='text-muted-foreground/50 pl-7 text-[10px] italic'>
            ...等 {options.length} 个选项
          </div>
        )}
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const options = (node.config.options || []) as ChoiceOption[]

    // --- 原子化选项管理逻辑 (已闭环) ---
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
          <span>选项设置</span>
          <Badge variant='secondary' className='h-4 px-1.5 font-mono'>
            {options.length}
          </Badge>
        </div>

        <div className='space-y-2'>
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
          onClick={addOption}
          className='text-muted-foreground border-border/60 hover:bg-muted/30 h-8 w-full border-dashed text-xs'
        >
          <Plus className='mr-1.5 h-3 w-3' /> 添加选项
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
