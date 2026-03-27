'use client'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Circle, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SortableInputRow } from '../components/sortable-row'
import { useOptionsManager } from '../hooks/use-options-manager'
import type { QuestionNode, ChoiceOption } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 内部组件：InlineOptionEditor
 * 直接在 QuestionCard 中编辑选项
 */
export function InlineOptionEditor({
  node,
  onConfigChange,
}: QuestionComponentProps) {
  const {
    options,
    focusId,
    addOption,
    removeOption,
    updateLabel,
    handleDragEnd,
    requestFocus,
  } = useOptionsManager(node, onConfigChange)

  const allowOther = !!(node.config as any).allowOther

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  return (
    <div className='flex flex-col'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((o: ChoiceOption) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {options.map((opt: ChoiceOption, i: number) => (
            <SortableInputRow
              key={opt.id}
              id={opt.id}
              value={opt.label}
              placeholder={`选项 ${i + 1}`}
              onChange={(label) => updateLabel(opt.id, label)}
              onDelete={() => removeOption(opt.id)}
              onEnter={() => addOption(i)}
              isFocused={focusId === opt.id}
              onBackspaceEmpty={() => {
                if (options.length > 1) {
                  const prevId = i > 0 ? options[i - 1].id : options[1]?.id
                  removeOption(opt.id)
                  if (prevId) requestFocus(prevId)
                }
              }}
              className='border-none px-0 py-0'
              showGrip={false}
              prefix={
                <span
                  className={cn(
                    'border-muted-foreground/25 bg-background mt-1.5 h-3.5 w-3.5 shrink-0 border-2 transition-colors',
                    node.type === 'single_choice'
                      ? 'rounded-full'
                      : 'rounded-[3px]'
                  )}
                />
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {allowOther && (
        <div className='flex items-center gap-2 px-0 py-1 opacity-60'>
          <span
            className={cn(
              'border-muted-foreground/25 bg-background h-3.5 w-3.5 shrink-0 border-2',
              node.type === 'single_choice' ? 'rounded-full' : 'rounded-[3px]'
            )}
          />
          <span className='text-muted-foreground text-xs italic'>
            其他（请填写）
          </span>
          <span className='text-muted-foreground/40 border-muted-foreground/20 ml-auto min-w-[48px] border-b text-[10px]' />
        </div>
      )}

      <Button
        variant='ghost'
        size='sm'
        onClick={() => addOption(options.length - 1)}
        className='text-muted-foreground/40 hover:bg-muted/40 hover:text-primary mt-1 h-7 gap-1.5 rounded px-1.5 text-[11px] font-medium transition'
      >
        <Plus className='h-3 w-3' />
        添加选项
      </Button>
    </div>
  )
}

/**
 * 题型打包定义
 */
export const singleChoiceType = defineQuestion({
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
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const { options, addOption, removeOption, updateLabel } = useOptionsManager(
      node,
      onConfigChange
    )

    return (
      <div className='flex flex-col gap-4 p-3'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>选项设置</span>
          <Badge variant='secondary' className='h-4 px-1.5 font-mono'>
            {options.length}
          </Badge>
        </div>

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
      </div>
    )
  },
  editor: InlineOptionEditor,
  capabilities: {
    valueType: 'string',
    operators: ['eq', 'neq', 'is_empty', 'is_not_empty'],
  },
})
