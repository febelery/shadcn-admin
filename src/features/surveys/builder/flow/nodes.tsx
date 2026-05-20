import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Eye, GitBranch, Play, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowGraphNode, QuestionType } from '../types'
import { useFlowContext } from './context'

export type NodeData = FlowGraphNode & {
  compact?: boolean
  selected?: boolean
  dimmed?: boolean
  hasError?: boolean
  hasWarn?: boolean
}

const handleClass =
  '!size-2 !border-2 !border-card !bg-muted-foreground/50 opacity-0'

/** 流程节点 · 统一栏宽，内容居中，连线竖直对齐 */
export const GraphNode = memo(function GraphNode({
  data,
}: NodeProps & { data: NodeData }) {
  const compact = data.compact ?? false
  const { getQuestionManifest } = useFlowContext()

  if (data.kind === 'start') {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <div className='bg-primary text-primary-foreground ring-primary/15 flex size-10 shrink-0 items-center justify-center rounded-full shadow-md ring-4'>
          <Play className='size-4 fill-current' />
        </div>
        <span
          className={cn(
            'text-xs leading-none',
            'text-primary mt-1.5 font-medium'
          )}
        >
          开始
        </span>
        <Handle
          type='source'
          position={Position.Bottom}
          className={handleClass}
        />
      </div>
    )
  }

  if (data.kind === 'end') {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <Handle type='target' position={Position.Top} className={handleClass} />
        <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 shadow-sm ring-4 ring-emerald-500/10 dark:text-emerald-400'>
          <Flag className='size-4' />
        </div>
        <span
          className={cn(
            'text-xs leading-none',
            'mt-1.5 max-w-full truncate px-2 text-center font-medium text-emerald-700 dark:text-emerald-400'
          )}
        >
          {data.label}
        </span>
      </div>
    )
  }

  const manifest = data.questionType
    ? getQuestionManifest(data.questionType as QuestionType)
    : undefined
  const TypeIcon = manifest?.icon

  return (
    <div
      className={cn(
        'bg-card flex h-full w-full flex-col rounded-xl border shadow-sm transition-all duration-150',
        data.dimmed && 'opacity-35',
        data.selected
          ? 'border-primary ring-primary/20 shadow-md ring-2'
          : 'border-border/80 hover:border-border hover:shadow-md',
        data.hasError && 'border-destructive ring-destructive/20 ring-2',
        data.hasWarn &&
          !data.hasError &&
          'border-amber-500 ring-2 ring-amber-500/20'
      )}
    >
      <Handle type='target' position={Position.Top} className={handleClass} />

      <div className={cn('flex flex-col gap-2', compact ? 'p-2.5' : 'p-3')}>
        <div className='flex items-center gap-2'>
          {TypeIcon ? (
            <span className='bg-muted/60 border-border/50 flex size-6 shrink-0 items-center justify-center rounded-md border'>
              <TypeIcon className='text-muted-foreground size-3.5' />
            </span>
          ) : null}
          <span
            className={cn(
              'text-xs leading-none',
              'text-muted-foreground min-w-0 flex-1 truncate'
            )}
          >
            {manifest?.label ?? '题目'}
          </span>
          <div className='flex shrink-0 gap-0.5'>
            {data.hasVisibilityRules ? (
              <span
                className='text-muted-foreground flex size-5 items-center justify-center'
                title='含显隐逻辑'
              >
                <Eye className='size-3' />
              </span>
            ) : null}
            {data.hasBranchRules ? (
              <span
                className='text-muted-foreground flex size-5 items-center justify-center'
                title='含分支逻辑'
              >
                <GitBranch className='size-3' />
              </span>
            ) : null}
          </div>
        </div>

        <p
          className={cn(
            'text-foreground text-base leading-snug font-semibold tracking-tight',
            'flex min-w-0 items-start gap-1 leading-snug',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3'
          )}
        >
          {data.numberLabel ? (
            <span className='text-foreground shrink-0 text-sm leading-snug font-semibold'>
              {data.numberLabel}
            </span>
          ) : null}
          <span className='min-w-0 font-semibold'>{data.label}</span>
        </p>

        {(data.hasError || data.hasWarn) && !compact ? (
          <p
            className={cn(
              'text-xs leading-none',
              data.hasError
                ? 'text-destructive'
                : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {data.hasError ? '存在逻辑错误' : '请检查逻辑配置'}
          </p>
        ) : null}
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        className={handleClass}
      />
    </div>
  )
})

export const nodeTypes = {
  graphNode: GraphNode,
}
