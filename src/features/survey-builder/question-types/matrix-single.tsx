import { LayoutGrid, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBuilderStore } from '@/features/survey-builder/store'
import { VisualMatrixEditor } from '../components/editors/matrix-editor'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 导出定义
 */
export const matrixSingleType: QuestionTypeDefinition = {
  type: 'matrix_single',
  meta: {
    label: '矩阵单选',
    description: '表格形式多维评估',
    icon: LayoutGrid,
    category: '选择类',
  },
  create: () => ({
    type: 'matrix_single',
    title: '矩阵单选题',
    required: false,
    config: {
      rows: [
        { id: crypto.randomUUID(), label: '维度 1' },
        { id: crypto.randomUUID(), label: '维度 2' },
      ],
      columns: [
        { id: crypto.randomUUID(), label: '选项 1' },
        { id: crypto.randomUUID(), label: '选项 2' },
        { id: crypto.randomUUID(), label: '选项 3' },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const rows = node.config.rows || []
    const cols = node.config.columns || []
    return (
      <div className='flex origin-top-left scale-90 flex-col gap-1.5 p-3 opacity-60'>
        <div className='ml-8 flex gap-1.5'>
          {cols.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className='bg-muted-foreground/20 h-2 w-6 rounded-full'
            />
          ))}
        </div>
        {rows.slice(0, 3).map((_, i) => (
          <div key={i} className='flex items-center gap-1.5'>
            <div className='bg-muted-foreground/20 h-2 w-8 shrink-0 rounded-full' />
            <div className='flex gap-1.5'>
              {cols.slice(0, 3).map((_, j) => (
                <div
                  key={j}
                  className='border-muted-foreground/30 h-3 w-3 rounded-full border'
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const rows = (node.config.rows || []) as any[]
    const cols = (node.config.columns || []) as any[]

    const addRow = () =>
      updateNodeConfig(node.id, {
        rows: [
          ...rows,
          { id: crypto.randomUUID(), label: `行 ${rows.length + 1}` },
        ],
      })
    const addCol = () =>
      updateNodeConfig(node.id, {
        columns: [
          ...cols,
          { id: crypto.randomUUID(), label: `列 ${cols.length + 1}` },
        ],
      })

    const removeRow = (id: string) =>
      rows.length > 1 &&
      updateNodeConfig(node.id, { rows: rows.filter((r) => r.id !== id) })
    const removeCol = (id: string) =>
      cols.length > 1 &&
      updateNodeConfig(node.id, { columns: cols.filter((c) => c.id !== id) })

    const updateItem = (
      type: 'rows' | 'columns',
      id: string,
      label: string
    ) => {
      const list = type === 'rows' ? rows : cols
      updateNodeConfig(node.id, {
        [type]: list.map((item) =>
          item.id === id ? { ...item, label } : item
        ),
      })
    }

    return (
      <div className='space-y-5 p-3 font-sans'>
        {/* 行管理 */}
        <div className='space-y-3'>
          <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
            <span>矩阵行 (维度)</span>
            <Badge variant='secondary' className='h-4 px-1.5 shadow-none'>
              {rows.length}
            </Badge>
          </div>
          <div className='space-y-1.5'>
            {rows.map((row) => (
              <div key={row.id} className='group flex items-center gap-2'>
                <Input
                  className='bg-muted/20 h-7 flex-1 border-transparent text-xs shadow-none'
                  value={row.label}
                  onChange={(e) => updateItem('rows', row.id, e.target.value)}
                />
                <button
                  onClick={() => removeRow(row.id)}
                  className='text-muted-foreground/20 hover:text-destructive p-1 opacity-0 transition-all group-hover:opacity-100'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={addRow}
            className='border-muted-foreground/20 text-muted-foreground hover:bg-muted/30 h-7 w-full border border-dashed text-[10px]'
          >
            <Plus className='mr-1 h-3 w-3' /> 添加行
          </Button>
        </div>

        {/* 列管理 */}
        <div className='border-border/40 space-y-3 border-t pt-3'>
          <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
            <span>矩阵列 (选项)</span>
            <Badge variant='secondary' className='h-4 px-1.5 shadow-none'>
              {cols.length}
            </Badge>
          </div>
          <div className='space-y-1.5'>
            {cols.map((col) => (
              <div key={col.id} className='group flex items-center gap-2'>
                <Input
                  className='bg-muted/20 h-7 flex-1 border-transparent text-xs shadow-none'
                  value={col.label}
                  onChange={(e) =>
                    updateItem('columns', col.id, e.target.value)
                  }
                />
                <button
                  onClick={() => removeCol(col.id)}
                  className='text-muted-foreground/20 hover:text-destructive p-1 opacity-0 transition-all group-hover:opacity-100'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={addCol}
            className='border-muted-foreground/20 text-muted-foreground hover:bg-muted/30 h-7 w-full border border-dashed text-[10px]'
          >
            <Plus className='mr-1 h-3 w-3' /> 添加列
          </Button>
        </div>
      </div>
    )
  },
  editor: VisualMatrixEditor,
  capabilities: {
    valueType: 'array',
    operators: ['is_empty', 'is_not_empty'],
  },
}
