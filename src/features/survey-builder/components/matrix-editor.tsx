'use client'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMatrixManager } from '../hooks/use-matrix-manager'
import type { QuestionNode } from '../types'
import type { QuestionComponentProps } from '../questions/index'

export function MatrixEditor({
  node,
  onConfigChange,
  readonly = false,
  multiple = false,
}: Partial<QuestionComponentProps> & {
  node: QuestionNode
  readonly?: boolean
  multiple?: boolean
}) {
  const { rows, cols, addRow, addCol, removeRow, removeCol, updateItem } =
    useMatrixManager(node, (patch) => !readonly && onConfigChange?.(patch))


  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        readonly && 'opacity-70 grayscale-[0.2]'
      )}
    >
      <div className='bg-background/40 relative overflow-hidden rounded-2xl border shadow-xs backdrop-blur-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[600px] border-collapse text-left text-xs'>
            <colgroup>
              <col className='w-[200px] min-w-[140px]' />
              {cols.map((col) => (
                <col key={col.id} className='min-w-[100px]' />
              ))}
              {!readonly && <col className='w-12' />}
            </colgroup>
            <thead>
              <tr className='bg-muted/20 border-b transition-colors'>
                <th className='bg-muted/30 text-muted-foreground sticky left-0 z-20 p-4 font-semibold backdrop-blur-md'></th>
                {cols.map((col, cIdx) => (
                  <th
                    key={col.id}
                    className='group/col border-border/40 relative border-r p-0 last:border-r-0'
                  >
                    <div className='group-hover/col:bg-muted/10 flex flex-col items-center gap-1 p-3 transition-all'>
                      {!readonly ? (
                        <textarea
                          className='placeholder:text-muted-foreground/30 w-full resize-none border-none bg-transparent py-1 text-center font-bold tracking-wide outline-none focus:ring-0'
                          value={col.label}
                          placeholder={`选项 ${cIdx + 1}`}
                          rows={1}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateItem('columns', col.id, e.target.value)
                          }
                        />
                      ) : (
                        <span className='text-muted-foreground/80 w-full py-1 text-center font-bold tracking-wide'>
                          {col.label || `选项 ${cIdx + 1}`}
                        </span>
                      )}
                      {!readonly && (
                        <button
                          onClick={() => removeCol(col.id)}
                          className='bg-destructive/10 text-destructive absolute -top-1 -right-1 flex size-5 cursor-pointer items-center justify-center rounded-full opacity-0 shadow-sm transition-all group-hover/col:opacity-100 hover:scale-110'
                        >
                          <Trash2 className='size-3' />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {!readonly && (
                  <th className='p-0'>
                    <button
                      onClick={addCol}
                      className='text-muted-foreground/40 hover:bg-primary/5 hover:text-primary flex size-full cursor-pointer items-center justify-center py-6 transition-all'
                      title='添加列'
                    >
                      <Plus className='size-4' />
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className='divide-border/30 divide-y'>
              {rows.map((row, rIdx) => (
                <tr
                  key={row.id}
                  className='group/row hover:bg-muted/5 transition-all'
                >
                  <td className='bg-background/80 group-hover/row:bg-muted/10 sticky left-0 z-10 p-0 backdrop-blur-md transition-all'>
                    <div className='relative flex items-center p-3'>
                      {!readonly ? (
                        <textarea
                          className='placeholder:text-muted-foreground/30 w-full resize-none border-none bg-transparent pr-8 pl-1 font-medium outline-none focus:ring-0'
                          value={row.label}
                          placeholder={`行 ${rIdx + 1}`}
                          rows={1}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateItem('rows', row.id, e.target.value)
                          }
                        />
                      ) : (
                        <span className='text-muted-foreground/80 w-full pr-8 pl-1 font-medium'>
                          {row.label || `行 ${rIdx + 1}`}
                        </span>
                      )}
                      {!readonly && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className='bg-destructive/10 text-destructive absolute right-2 flex size-5 cursor-pointer items-center justify-center rounded-full opacity-0 transition-all group-hover/row:opacity-100 hover:scale-110'
                        >
                          <Trash2 className='size-3' />
                        </button>
                      )}
                    </div>
                  </td>
                  {cols.map((col) => (
                    <td
                      key={col.id}
                      className='border-border/30 border-r p-4 transition-all last:border-r-0'
                    >
                      <div className='flex items-center justify-center'>
                        <div
                          className={cn(
                            'border-border/50 bg-muted/20 border transition-all duration-300',
                            multiple
                              ? 'size-4 rounded-sm'
                              : 'size-4 rounded-full',
                            !readonly &&
                              'group-hover/row:border-primary/30 group-hover/row:bg-primary/5 group-hover/row:scale-110'
                          )}
                        />
                      </div>
                    </td>
                  ))}
                  {!readonly && <td className='bg-muted/5' />}
                </tr>
              ))}
              {!readonly && (
                <tr>
                  <td colSpan={cols.length + 2} className='p-0'>
                    <button
                      onClick={addRow}
                      className='text-muted-foreground/40 hover:bg-primary/5 hover:text-primary flex w-full cursor-pointer items-center justify-center gap-2 py-4 transition-all'
                    >
                      <Plus className='size-3.5' />
                      <span className='text-[10px] font-bold tracking-widest uppercase'>
                        添加行
                      </span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
