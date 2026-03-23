import { Text } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 题型出口定义
 */
export const textType: QuestionTypeDefinition = {
  type: 'text',
  meta: {
    label: '单行输入',
    description: '简短文本回答',
    icon: Text,
    category: '输入类',
  },
  create: () => ({
    type: 'text',
    title: '请输入您的回答',
    required: false,
    config: {
      placeholder: '请输入...',
      minLength: undefined,
      maxLength: undefined,
      format: undefined,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='space-y-2 p-4 opacity-50'>
        <div className='border-muted-foreground/20 bg-muted/20 flex h-9 w-full items-center rounded-md border-2 px-3'>
          <span className='text-muted-foreground/40 font-mono text-xs'>
            {node.config.placeholder || '请输入...'}
          </span>
        </div>
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const config = node.config as any

    return (
      <div className='space-y-4 p-3'>
        <div className='space-y-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            占位提示
          </label>
          <Input
            className='bg-muted/20 focus-visible:bg-background h-8 border-transparent text-xs shadow-none transition-colors'
            value={config.placeholder || ''}
            placeholder='请输入...'
            onChange={(e) =>
              updateNodeConfig(node.id, { placeholder: e.target.value })
            }
          />
        </div>

        <div className='border-border/40 grid grid-cols-2 gap-2 border-t pt-3'>
          <div className='space-y-1.5'>
            <label className='text-muted-foreground pl-0.5 text-[10px]'>
              最小长度
            </label>
            <Input
              type='number'
              className='h-7 text-xs'
              value={config.minLength ?? ''}
              placeholder='不限'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  minLength: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </div>
          <div className='space-y-1.5'>
            <label className='text-muted-foreground pl-0.5 text-[10px]'>
              最大长度
            </label>
            <Input
              type='number'
              className='h-7 text-xs'
              value={config.maxLength ?? ''}
              placeholder='不限'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  maxLength: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </div>
        </div>

        <div className='border-border/40 space-y-2 border-t pt-3'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            格式校验
          </label>
          <Select
            value={config.format ?? 'none'}
            onValueChange={(v) =>
              updateNodeConfig(node.id, {
                format: v === 'none' ? undefined : v,
              })
            }
          >
            <SelectTrigger className='bg-muted/20 h-8 border-transparent text-xs'>
              <SelectValue placeholder='不限格式' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none' className='text-xs'>
                不限格式
              </SelectItem>
              <SelectItem value='email' className='text-xs'>
                邮箱地址
              </SelectItem>
              <SelectItem value='phone' className='text-xs'>
                手机号码
              </SelectItem>
              <SelectItem value='url' className='text-xs'>
                网址 URL
              </SelectItem>
            </SelectContent>
          </Select>
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
