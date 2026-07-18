import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { PaletteTypeId } from './question-type-hints'

/** 题型库 HoverCard 内迷你示意（仅复杂题型） */
export function QuestionTypePreview({ type }: { type: PaletteTypeId }) {
  switch (type) {
    case 'matrix_single':
    case 'matrix_multiple':
      return <MatrixPreview multiple={type === 'matrix_multiple'} />
    case 'likert':
      return <LikertPreview />
    case 'nps':
      return <NpsPreview />
    case 'cascader':
      return <CascaderPreview />
    case 'ranking':
      return <RankingPreview />
    default:
      return null
  }
}

function MatrixPreview({ multiple }: { multiple: boolean }) {
  return (
    <div className='bg-muted/50 rounded-md border p-2'>
      <div className='grid grid-cols-4 gap-1 text-[9px]'>
        <div />
        {['A', 'B', 'C'].map((c) => (
          <div
            key={c}
            className='text-muted-foreground text-center font-medium'
          >
            {c}
          </div>
        ))}
        {['行1', '行2'].map((row) => (
          <Fragment key={row}>
            <div className='text-muted-foreground truncate'>{row}</div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='bg-background mx-auto flex size-3.5 items-center justify-center rounded-sm border'
              >
                {multiple ? (
                  i === 1 ? (
                    <div className='bg-primary/50 size-2 rounded-[1px]' />
                  ) : null
                ) : i === 1 ? (
                  <div className='bg-primary/50 ring-primary/40 size-1.5 rounded-full ring-1' />
                ) : null}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function LikertPreview() {
  const cols = ['1', '2', '3', '4', '5']
  return (
    <div className='bg-muted/50 overflow-hidden rounded-md border text-[9px]'>
      <div className='bg-muted/80 grid grid-cols-6 gap-px border-b p-1'>
        <div />
        {cols.map((c) => (
          <div key={c} className='text-muted-foreground text-center'>
            {c}
          </div>
        ))}
      </div>
      {['陈述 A', '陈述 B'].map((row) => (
        <div
          key={row}
          className='grid grid-cols-6 gap-px border-b p-1 last:border-0'
        >
          <div className='text-muted-foreground truncate'>{row}</div>
          {cols.map((c, i) => (
            <div key={c} className='flex justify-center'>
              <div
                className={cn(
                  'border-muted-foreground/35 size-2 rounded-full border',
                  i === 2 &&
                    'border-primary/60 bg-primary/25 ring-primary/20 ring-1'
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function NpsPreview() {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex justify-between text-[9px]'>
        <span className='text-muted-foreground'>不可能</span>
        <span className='text-muted-foreground'>极有可能</span>
      </div>
      <div className='flex gap-0.5'>
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'flex h-5 flex-1 items-center justify-center rounded-sm border text-[8px]',
              i >= 9
                ? 'border-primary/40 bg-primary/15 font-medium'
                : 'bg-muted/60 text-muted-foreground'
            )}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  )
}

function CascaderPreview() {
  return (
    <div className='bg-muted/50 flex gap-1 rounded-md border p-2 text-[10px]'>
      {['省', '市', '区'].map((l, i) => (
        <div
          key={l}
          className={cn(
            'bg-background flex-1 rounded-sm border px-1.5 py-1 text-center',
            i === 0 && 'border-primary/50'
          )}
        >
          {l}
        </div>
      ))}
    </div>
  )
}

function RankingPreview() {
  return (
    <div className='flex flex-col gap-1'>
      {['选项 A', '选项 B', '选项 C'].map((l, i) => (
        <div
          key={l}
          className='bg-muted/50 flex items-center gap-2 rounded-md border px-2 py-1 text-[10px]'
        >
          <span className='text-muted-foreground font-mono'>{i + 1}</span>
          <span className='flex-1 truncate'>{l}</span>
        </div>
      ))}
    </div>
  )
}
