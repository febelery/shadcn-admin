import { Circle, Square, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LABEL_LIMITS } from '../../store'
import type { MatrixColumn, MatrixRow, QuestionElement } from '../../types'
import { useBuilderStatic } from '../../context'
import { InlineEditable } from '../inline-editable'

type Props = {
  question: QuestionElement
  onConfigChange: (patch: Partial<QuestionElement['config']>) => void
}

export function SurfaceMatrixEditor({ question, onConfigChange }: Props) {
  const { createQuestionId } = useBuilderStatic()
  const rows = question.config.rows ?? []
  const cols = question.config.columns ?? []
  const isSingle = question.type === 'matrix_single'
  const CellIcon = isSingle ? Circle : Square

  const setRows = (next: MatrixRow[]) => onConfigChange({ rows: next })
  const setCols = (next: MatrixColumn[]) => onConfigChange({ columns: next })

  return (
    <div className='max-w-full overflow-x-auto'>
      <table
        className={cn(
          'w-full min-w-[280px] table-fixed border-collapse',
          'text-sm leading-relaxed'
        )}
      >
        <colgroup>
          <col style={{ width: '7rem' }} />
          {cols.map((c) => (
            <col key={c.id} style={{ width: '5.5rem' }} />
          ))}
          <col style={{ width: '2rem' }} />
        </colgroup>
        <thead>
          <tr>
            <th className='p-1' />
            {cols.map((c) => (
              <th key={c.id} className='overflow-hidden p-1 font-normal'>
                <InlineEditable
                  value={c.label}
                  onChange={(label) =>
                    setCols(
                      cols.map((col) =>
                        col.id === c.id ? { ...col, label } : col
                      )
                    )
                  }
                  placeholder='列'
                  compact
                  maxLength={LABEL_LIMITS.matrixCol}
                  className={cn(
                    'text-muted-foreground text-xs leading-relaxed',
                    'mx-auto text-center'
                  )}
                />
              </th>
            ))}
            <th className='p-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-7'
                data-surface-chrome
                aria-label='添加列'
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setCols([
                    ...cols,
                    {
                      id: createQuestionId(),
                      label: `列 ${cols.length + 1}`,
                    },
                  ])
                }}
              >
                <Plus className='size-3.5' />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className='border-border/50 border-t'>
              <td className='overflow-hidden p-1 pr-2'>
                <div className='flex min-w-0 items-center gap-1'>
                  <InlineEditable
                    value={r.label}
                    onChange={(label) =>
                      setRows(
                        rows.map((row) =>
                          row.id === r.id ? { ...row, label } : row
                        )
                      )
                    }
                    placeholder='行'
                    compact
                    maxLength={LABEL_LIMITS.matrixRow}
                    className={cn('min-w-0 flex-1', 'text-xs leading-none')}
                  />
                  {rows.length > 1 ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='text-destructive size-6 shrink-0'
                      data-surface-chrome
                      aria-label='删除行'
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setRows(rows.filter((row) => row.id !== r.id))
                      }}
                    >
                      <Trash2 className='size-3' />
                    </Button>
                  ) : null}
                </div>
              </td>
              {cols.map((c) => (
                <td key={c.id} className='p-2 text-center'>
                  <CellIcon className='text-muted-foreground/35 mx-auto size-4 stroke-[1.5]' />
                </td>
              ))}
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className={cn(
          'text-muted-foreground text-xs leading-relaxed',
          'mt-2 h-8'
        )}
        data-surface-chrome
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          setRows([
            ...rows,
            { id: createQuestionId(), label: `行 ${rows.length + 1}` },
          ])
        }}
      >
        <Plus className='size-3.5' />
        添加行
      </Button>
    </div>
  )
}
