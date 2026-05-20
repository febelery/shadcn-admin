import { Circle, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LikertStatement, QuestionElement } from '../../core/types'
import { createQuestionId } from '../../core/schema-defaults'
import { LABEL_LIMITS } from '../label-limits'
import {
  builderTypeBody,
  builderTypeCaption,
  builderTypeControl,
} from '../ui'
import { InlineEditable } from './inline-editable'

type Props = {
  question: QuestionElement
  onConfigChange: (patch: Partial<QuestionElement['config']>) => void
}

const COL_WIDTH = '3rem'
const ROW_LABEL_WIDTH = '7rem'

/** 根据最小/最大分值生成量表列 */
function buildScalePoints(min: number, max: number): number[] {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  const points: number[] = []
  for (let i = low; i <= high; i++) {
    points.push(i)
  }
  return points
}

export function SurfaceLikertEditor({ question, onConfigChange }: Props) {
  const statements = question.config.statements ?? []
  const scaleMin = question.config.scaleMin ?? 1
  const scaleMax = question.config.scaleMax ?? 5
  const scalePoints = buildScalePoints(scaleMin, scaleMax)

  const setStatements = (next: LikertStatement[]) =>
    onConfigChange({ statements: next })

  return (
    <div className='max-w-full overflow-x-auto'>
      <table className={cn('w-full min-w-[280px] table-fixed border-collapse', builderTypeBody)}>
        <colgroup>
          <col style={{ width: ROW_LABEL_WIDTH }} />
          {scalePoints.map((p) => (
            <col key={p} style={{ width: COL_WIDTH }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className='p-1' />
            {scalePoints.map((p) => (
              <th
                key={p}
                className={cn(builderTypeCaption, 'p-1 text-center font-normal tabular-nums')}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statements.map((s) => (
            <tr key={s.id} className='border-border/50 border-t'>
              <td className='overflow-hidden p-1 pr-2'>
                <div className='flex min-w-0 items-center gap-1'>
                  <InlineEditable
                    value={s.label}
                    onChange={(label) =>
                      setStatements(
                        statements.map((row) =>
                          row.id === s.id ? { ...row, label } : row
                        )
                      )
                    }
                    placeholder='陈述句'
                    compact
                    maxLength={LABEL_LIMITS.likertStatement}
                    className={cn('min-w-0 flex-1', builderTypeControl)}
                  />
                  {statements.length > 1 ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='text-destructive size-6 shrink-0'
                      data-surface-chrome
                      aria-label='删除陈述'
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatements(statements.filter((row) => row.id !== s.id))
                      }}
                    >
                      <Trash2 className='size-3' />
                    </Button>
                  ) : null}
                </div>
              </td>
              {scalePoints.map((p) => (
                <td key={p} className='p-2 text-center'>
                  <Circle className='text-muted-foreground/35 mx-auto size-4 stroke-[1.5]' />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className={cn(builderTypeCaption, 'mt-2 h-8')}
        data-surface-chrome
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          setStatements([
            ...statements,
            {
              id: createQuestionId(),
              label: `陈述 ${statements.length + 1}`,
            },
          ])
        }}
      >
        <Plus className='size-3.5' />
        添加陈述
      </Button>
    </div>
  )
}
