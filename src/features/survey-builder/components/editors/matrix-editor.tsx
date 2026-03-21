'use client'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

export function VisualMatrixEditor({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const rows = node.config.rows ?? [{ id: crypto.randomUUID(), label: '新行' }]
  const cols = node.config.columns ?? [
    { id: crypto.randomUUID(), label: '新列' },
  ]
  const isMulti = node.type === 'matrix_multiple'

  const updateRows = (newRows: any[]) =>
    updateNodeConfig(node.id, { rows: newRows })
  const updateCols = (newCols: any[]) =>
    updateNodeConfig(node.id, { columns: newCols })

  const addRow = () =>
    updateRows([...rows, { id: crypto.randomUUID(), label: '' }])
  const addCol = () =>
    updateCols([...cols, { id: crypto.randomUUID(), label: '' }])

  return (
    <div className='flex flex-col' onClick={(e) => e.stopPropagation()}>
      <div className='border-border/60 bg-background overflow-x-auto rounded-xl border shadow-sm'>
        <table className='min-w-full table-fixed border-collapse text-xs'>
          <colgroup>
            <col className='w-[140px]' />
            {cols.map((col) => (
              <col key={col.id} className='w-[160px]' />
            ))}
            <col className='w-12' />
          </colgroup>
          <thead className='sticky top-0 z-20'>
            <tr className='bg-muted/30'>
              <th className='border-border/40 bg-muted sticky left-0 z-30 border-r p-0 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]'></th>
              {cols.map((col, cIdx) => (
                <th
                  key={col.id}
                  className='group/col border-border/40 relative border-r border-b p-0 last:border-r-0'
                >
                  <div className='flex items-center px-1'>
                    <textarea
                      className='placeholder:text-muted-foreground/30 focus:bg-primary/5 field-sizing-content min-h-[40px] w-full resize-none border-none bg-transparent py-2.5 text-center font-medium ring-0 transition-colors outline-none'
                      value={col.label}
                      placeholder={`列 ${cIdx + 1}`}
                      rows={1}
                      onChange={(e) =>
                        updateCols(
                          cols.map((c) =>
                            c.id === col.id
                              ? { ...c, label: e.target.value }
                              : c
                          )
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        cols.length > 1 &&
                        updateCols(cols.filter((c) => c.id !== col.id))
                      }
                      className='text-muted-foreground/20 hover:text-destructive absolute top-1 right-1 hidden size-4 items-center justify-center rounded group-hover/col:flex'
                    >
                      <Trash2 className='size-3' />
                    </button>
                  </div>
                </th>
              ))}
              {/* Add Column Button inside header row */}
              <th className='border-border/40 border-b p-0'>
                <button
                  onClick={addCol}
                  className='text-muted-foreground/40 hover:bg-primary/5 hover:text-primary flex h-10 w-full items-center justify-center transition-all'
                  title='添加列'
                >
                  <Plus className='size-4' />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={row.id}
                className='group/row border-border/40 border-b last:border-b-0'
              >
                <td className='bg-background border-border/40 sticky left-0 z-10 border-r p-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                  <div className='flex items-center px-1'>
                    <textarea
                      className='placeholder:text-muted-foreground/30 focus:bg-primary/5 field-sizing-content min-h-[44px] w-full resize-none border-none bg-transparent py-3 pr-8 pl-3 font-medium ring-0 transition-colors outline-none'
                      value={row.label}
                      placeholder={`行 ${rIdx + 1}`}
                      rows={1}
                      onChange={(e) =>
                        updateRows(
                          rows.map((r) =>
                            r.id === row.id
                              ? { ...r, label: e.target.value }
                              : r
                          )
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        rows.length > 1 &&
                        updateRows(rows.filter((r) => r.id !== row.id))
                      }
                      className='text-muted-foreground/20 hover:text-destructive absolute top-1/2 right-1 hidden size-5 -translate-y-1/2 items-center justify-center rounded group-hover/row:flex'
                    >
                      <Trash2 className='size-3' />
                    </button>
                  </div>
                </td>
                {cols.map((col) => (
                  <td
                    key={col.id}
                    className='border-border/40 border-r p-0 last:border-r-0'
                  >
                    <div className='flex h-full items-center justify-center py-3 opacity-20'>
                      <span
                        className={cn(
                          'size-3.5 border transition-all',
                          isMulti
                            ? 'rounded-[3px] border-2 shadow-sm'
                            : 'rounded-full border-2'
                        )}
                      />
                    </div>
                  </td>
                ))}
                {/* Placeholder for Add Column column */}
                <td className='bg-muted/5 border-border/40' />
              </tr>
            ))}
            {/* Add Row Button row */}
            <tr>
              <td className='bg-background border-border/40 sticky left-0 z-10 border-r p-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'>
                <button
                  onClick={addRow}
                  className='text-muted-foreground/40 hover:bg-primary/5 hover:text-primary flex h-10 w-full items-center justify-start gap-2 px-4 transition-all'
                >
                  <Plus className='size-3.5' />
                  <span className='text-[11px] font-medium tracking-wider uppercase'>
                    添加行
                  </span>
                </button>
              </td>
              {cols.map((col) => (
                <td
                  key={col.id}
                  className='bg-muted/5 border-border/40 border-r last:border-r-0'
                />
              ))}
              <td className='bg-muted/5 border-border/40' />
            </tr>
          </tbody>
        </table>
      </div>

      <div className='text-muted-foreground/30 mt-3 flex items-center justify-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase'>
        <div className='bg-border/20 h-px flex-1' />
        Visual Editor Active
        <div className='bg-border/20 h-px flex-1' />
      </div>
    </div>
  )
}
