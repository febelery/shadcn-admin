'use client'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

export function InlineNpsEditor({ node }: { node: QuestionNode }) {
  const lowLabel = node.config.lowLabel || '极不推荐'
  const highLabel = node.config.highLabel || '极力推荐'
  const { updateNodeConfig } = useBuilderStore()

  return (
    <div
      className='flex flex-col gap-4 p-2'
      onClick={(e) => e.stopPropagation()}
    >
      <div className='flex flex-col gap-2'>
        <div className='flex gap-0.5'>
          {Array.from({ length: 11 }).map((_, i) => {
            const colorClass =
              i <= 6
                ? 'bg-red-50 text-red-400/80 dark:bg-red-950/30'
                : i <= 8
                  ? 'bg-amber-50 text-amber-500/80 dark:bg-amber-950/30'
                  : 'bg-green-50 text-green-500/80 dark:bg-green-950/30'

            return (
              <div
                key={i}
                className={cn(
                  'flex flex-1 items-center justify-center rounded py-1 font-mono text-[10px] font-semibold transition-all',
                  colorClass
                )}
              >
                {i}
              </div>
            )
          })}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase'>
            左侧标签 (0 分)
          </span>
          <textarea
            className='bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/40 h-10 w-full resize-none rounded-lg border p-2 text-xs transition-all outline-none'
            value={lowLabel}
            onChange={(e) =>
              updateNodeConfig(node.id, { lowLabel: e.target.value })
            }
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase'>
            右侧标签 (10 分)
          </span>
          <textarea
            className='bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/40 h-10 w-full resize-none rounded-lg border p-2 text-right text-xs transition-all outline-none'
            value={highLabel}
            onChange={(e) =>
              updateNodeConfig(node.id, { highLabel: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  )
}
