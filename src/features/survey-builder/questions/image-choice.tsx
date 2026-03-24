import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Link2,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { useOptionsManager } from '../hooks/use-options-manager'
import type { QuestionNode, ChoiceOption } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 题型定义
 */
export const imageChoiceType = defineQuestion({
  type: 'image_choice',
  meta: {
    label: '图片选择',
    description: '可视化的图片选项',
    icon: ImageIcon,
    category: '选择类',
  },
  create: () => ({
    type: 'image_choice',
    title: '请选择以下图片',
    required: false,
    config: {
      options: [
        {
          id: crypto.randomUUID(),
          label: '图片 1',
          value: 'opt_1',
          order: 0,
          image: '',
        },
        {
          id: crypto.randomUUID(),
          label: '图片 2',
          value: 'opt_2',
          order: 1,
          image: '',
        },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const options = (node.config.options || []) as ChoiceOption[]
    return (
      <div className='grid grid-cols-2 gap-2 p-4 opacity-70'>
        {options.slice(0, 4).map((opt) => (
          <div
            key={opt.id}
            className='border-muted-foreground/20 bg-muted/20 flex flex-col rounded-md border pb-2'
          >
            <div className='bg-muted/40 flex aspect-video items-center justify-center rounded-t-sm'>
              <ImageIcon className='text-muted-foreground/30 h-4 w-4' />
            </div>
            <span className='text-muted-foreground truncate px-2 pt-1.5 text-center text-[10px]'>
              {opt.label || '图片选项'}
            </span>
          </div>
        ))}
      </div>
    )
  },
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const { options, addOption, removeOption, updateItem } = useOptionsManager(
      node,
      onConfigChange
    )

    return (
      <div className='space-y-4 p-3 font-sans'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>图片选项列表</span>
          <Badge
            variant='secondary'
            className='h-4 px-1.5 font-mono shadow-none'
          >
            {options.length}
          </Badge>
        </div>

        <div className='space-y-3'>
          {options.map((opt, i) => (
            <div
              key={opt.id}
              className='group border-border/40 bg-muted/10 hover:bg-muted/20 rounded-lg border p-2 transition-colors'
            >
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-muted-foreground/30 font-mono text-[10px] font-bold uppercase'>
                  选项 {i + 1}
                </span>
                <button
                  onClick={() => removeOption(opt.id)}
                  className='text-muted-foreground/30 hover:text-destructive p-1 transition-all'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>

              <div className='space-y-1.5'>
                <input
                  className='hover:border-border/50 focus:border-primary/50 h-6 w-full border-b border-transparent bg-transparent text-xs font-medium shadow-none transition-colors outline-none'
                  value={opt.label}
                  placeholder={`选项标题...`}
                  onChange={(e) =>
                    updateItem(opt.id, { label: e.target.value })
                  }
                />
                <div className='text-muted-foreground/50 flex items-center gap-2'>
                  <Link2 className='h-3 w-3 shrink-0' />
                  <input
                    className='h-5 w-full truncate bg-transparent text-[10px] shadow-none outline-none'
                    value={(opt as any).image || ''}
                    placeholder='图片 URL 地址...'
                    onChange={(e) =>
                      updateItem(opt.id, { image: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => addOption()}
          className='text-muted-foreground hover:bg-muted/30 h-8 w-full border-dashed text-xs shadow-none transition-colors'
        >
          <Plus className='mr-1.5 h-3 w-3' /> 添加图片选项
        </Button>
      </div>
    )
  },
  editor: function Editor({ node, onConfigChange }: QuestionComponentProps) {
    const { options, addOption, removeOption, updateLabel, updateItem } =
      useOptionsManager(node, onConfigChange)

    const updateImage = (id: string, image: string) => updateItem(id, { image })

    return (
      <div className='flex flex-col gap-3'>
        <div className='grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3'>
          {options.map((opt, i) => (
            <div key={opt.id} className='group/card flex flex-col gap-1.5'>
              <FileUpload
                value={opt.image ? [opt.image] : []}
                onChange={(urls) => {
                  const arr = Array.isArray(urls) ? urls : [urls]
                  const url = arr[arr.length - 1]
                  if (url) updateImage(opt.id, url as string)
                }}
                view='card'
                cardSize='full'
                variant='minimal'
                validation={{
                  accept: ['image/*'],
                  maxFiles: 1,
                  maxSize: 5 * 1024 * 1024,
                }}
              />

              {/* 标签行 */}
              <div className='flex items-center gap-1.5 px-0.5'>
                <span className='text-muted-foreground/25 shrink-0 font-mono text-[10px] font-bold select-none'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <input
                  type='text'
                  className='text-foreground placeholder:text-muted-foreground/30 min-w-0 flex-1 border-none bg-transparent py-0.5 text-xs font-medium shadow-none ring-0 outline-none'
                  value={opt.label}
                  placeholder={`选项 ${i + 1}`}
                  onChange={(e) => updateLabel(opt.id, e.target.value)}
                  data-opt-id={opt.id}
                />
                <button
                  onClick={() => removeOption(opt.id)}
                  className='text-muted-foreground/20 hover:text-destructive flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-all duration-150 group-hover/card:opacity-100'
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            </div>
          ))}
          <div className='flex flex-col gap-1.5'>
            <button
              onClick={() => {
                addOption(options.length - 1)
              }}
              className={cn(
                'group/add aspect-square w-full rounded-xl',
                'border-border/40 border border-dashed',
                'flex flex-col items-center justify-center gap-2.5',
                'text-muted-foreground/50 transition-colors duration-150',
                'hover:border-border/70 hover:bg-muted/20 hover:text-muted-foreground shadow-none'
              )}
            >
              <div className='flex flex-col items-center gap-2'>
                <Upload className='h-6 w-6 opacity-40 transition-opacity group-hover/add:opacity-70' />
                <span className='text-[12px] font-normal'>添加选项</span>
              </div>
            </button>
            <div className='h-[22px]' />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'array',
    operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  },
})
