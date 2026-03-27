import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowUpDown, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SortableInputRow } from '../components/sortable-row'
import { useOptionsManager } from '../hooks/use-options-manager'
import type { QuestionNode, ChoiceOption } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 题型定义
 */
export const rankingType = defineQuestion({
  type: 'ranking',
  meta: {
    label: '排序题',
    description: '拖拽选项进行排序',
    icon: ArrowUpDown,
    category: '选择类',
  },
  create: () => ({
    type: 'ranking',
    title: '请按先后顺序排列以下项目',
    required: false,
    config: {
      options: [
        {
          id: crypto.randomUUID(),
          label: '排序项 A',
          value: 'opt_a',
          order: 0,
        },
        {
          id: crypto.randomUUID(),
          label: '排序项 B',
          value: 'opt_b',
          order: 1,
        },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const options = (node.config.options || []) as ChoiceOption[]
    return (
      <div className='pointer-events-none flex flex-col gap-2 p-4 opacity-60'>
        {options.slice(0, 3).map((opt, i) => (
          <div
            key={opt.id}
            className='border-muted-foreground/20 bg-muted/20 flex items-center gap-3 rounded border px-2 py-1.5'
          >
            <span className='text-muted-foreground/40 w-3 font-mono text-[10px] font-bold'>
              {i + 1}
            </span>
            <span className='text-muted-foreground truncate text-xs'>
              {opt.label || '排序项'}
            </span>
            <ArrowUpDown className='text-muted-foreground/20 ml-auto h-3 w-3' />
          </div>
        ))}
        {options.length > 3 && (
          <div className='text-muted-foreground/50 mt-1 text-center text-[10px] italic'>
            + {options.length - 3} 更多排序项
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
      <div className='flex flex-col gap-4 p-3 font-sans'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>排序列表设置</span>
          <Badge
            variant='secondary'
            className='h-4 px-1.5 font-mono shadow-none'
          >
            {options.length}
          </Badge>
        </div>

        <div className='flex flex-col gap-1.5'>
          {options.map((opt, i) => (
            <div key={opt.id} className='group flex items-center gap-2'>
              <div className='text-muted-foreground/40 w-4 text-center font-mono text-[10px] font-bold'>
                {i + 1}
              </div>
              <Input
                className='bg-muted/20 focus-visible:bg-background focus-visible:border-border h-8 flex-1 border-transparent px-2 text-xs shadow-none transition-colors'
                value={opt.label}
                onChange={(e) => updateLabel(opt.id, e.target.value)}
                placeholder='请输入项目名称...'
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
          className='text-muted-foreground hover:bg-muted/30 h-8 w-full border-dashed text-xs shadow-none transition-colors'
        >
          <Plus className='mr-1.5 h-3 w-3' /> 添加排序项
        </Button>
      </div>
    )
  },
  editor: function Editor({ node, onConfigChange }: QuestionComponentProps) {
    const {
      options,
      focusId,
      addOption,
      removeOption,
      updateLabel,
      handleDragEnd,
    } = useOptionsManager(node, onConfigChange)

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    return (
      <div className='flex flex-col gap-3'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={options.map((o: ChoiceOption) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='flex flex-col gap-2'>
              {options.map((opt, i) => (
                <div
                  key={opt.id}
                  className='group/ranking flex items-center gap-2'
                >
                  <div className='border-border/40 bg-muted/20 text-muted-foreground/40 flex size-8 items-center justify-center rounded-lg border font-mono text-xs font-bold'>
                    {i + 1}
                  </div>
                  <div className='flex-1'>
                    <SortableInputRow
                      id={opt.id}
                      value={opt.label}
                      placeholder={`排序项 ${i + 1}`}
                      onChange={(label: string) => updateLabel(opt.id, label)}
                      onDelete={() => removeOption(opt.id)}
                      onEnter={() => addOption(i)}
                      className='border-none px-0 py-0 shadow-none'
                      showGrip={true}
                      isFocused={focusId === opt.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant='ghost'
          size='sm'
          onClick={() => addOption(options.length - 1)}
          className='text-muted-foreground/30 hover:bg-muted/40 hover:text-primary h-8 w-fit gap-1.5 rounded-lg px-3 text-xs font-bold tracking-widest uppercase shadow-none transition'
        >
          <Plus className='size-3.5' />
          添加排序项
        </Button>
      </div>
    )
  },
  capabilities: {
    valueType: 'array',
    operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  },
})
