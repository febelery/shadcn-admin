'use client'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMatrixManager } from '../hooks/use-matrix-manager'
import type { QuestionComponentProps } from '../questions/index'

export function MatrixPanel({
  node,
  onConfigChange,
}: QuestionComponentProps) {
  const { rows, cols, addRow, addCol, removeRow, removeCol, updateItem } =
    useMatrixManager(node, onConfigChange)

  return (
    <div className='flex flex-col gap-6 p-3 font-sans'>
      {/* 行管理 */}
      <div className='flex flex-col gap-3'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>矩阵行</span>
          <Badge variant='secondary' className='h-4 px-1.5 shadow-none'>
            {rows.length}
          </Badge>
        </div>
        <div className='flex flex-col gap-1.5'>
          {rows.map((row, i) => (
            <div key={row.id} className='group flex items-center gap-2'>
              <Input
                className='bg-muted/20 focus:bg-background h-7 flex-1 border-transparent text-xs shadow-none transition-colors'
                value={row.label}
                placeholder={`行 ${i + 1}`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateItem('rows', row.id, e.target.value)
                }
              />
              <button
                onClick={() => removeRow(row.id)}
                className='text-muted-foreground/20 hover:text-destructive pointer-events-none p-1 opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100'
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
      <div className='border-border/40 flex flex-col gap-3 border-t pt-4'>
        <div className='text-muted-foreground/60 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase'>
          <span>矩阵列</span>
          <Badge variant='secondary' className='h-4 px-1.5 shadow-none'>
            {cols.length}
          </Badge>
        </div>
        <div className='flex flex-col gap-1.5'>
          {cols.map((col, i) => (
            <div key={col.id} className='group flex items-center gap-2'>
              <Input
                className='bg-muted/20 focus:bg-background h-7 flex-1 border-transparent text-xs shadow-none transition-colors'
                value={col.label}
                placeholder={`列 ${i + 1}`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateItem('columns', col.id, e.target.value)
                }
              />
              <button
                onClick={() => removeCol(col.id)}
                className='text-muted-foreground/20 hover:text-destructive pointer-events-none p-1 opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100'
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
}
