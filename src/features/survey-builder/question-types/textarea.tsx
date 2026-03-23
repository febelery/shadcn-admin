import { AlignLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 题型出口定义
 */
export const textareaType: QuestionTypeDefinition = {
  type: 'textarea',
  meta: {
    label: '多行输入',
    description: '适用于长文本回答',
    icon: AlignLeft,
    category: '输入类',
  },
  create: () => ({
    type: 'textarea',
    title: '请详细描述您的问题',
    required: false,
    config: { placeholder: '请在此输入内容...', maxLength: undefined },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='space-y-2 p-4 opacity-50'>
        <div className='border-muted-foreground/20 bg-muted/20 h-20 w-full rounded-md border-2' />
        <span className='text-muted-foreground px-0.5 text-[10px] italic'>
          {node.config.placeholder || '默认多行占位符'}
        </span>
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    return (
      <div className='space-y-4 p-3 font-sans'>
        <div className='space-y-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            输入框占位符
          </label>
          <Input
            className='bg-muted/20 hover:bg-muted/40 h-8 border-transparent text-xs transition-colors'
            value={node.config.placeholder || ''}
            placeholder='提示用户输入的文字...'
            onChange={(e) =>
              updateNodeConfig(node.id, { placeholder: e.target.value })
            }
          />
        </div>
        <div className='border-border/40 space-y-2 border-t pt-3'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            输入限制
          </label>
          <div className='flex items-center gap-2'>
            <Input
              type='number'
              className='h-7 text-xs'
              value={node.config.maxLength || ''}
              placeholder='最大字符数'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  maxLength: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'string',
    operators: [
      'eq',
      'neq',
      'contains',
      'not_contains',
      'is_empty',
      'is_not_empty',
      'regex',
    ],
  },
}
