import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { FlowGraphNode } from '../../core/logic/flow-graph'
import type { QuestionType } from '../../core/types'
import { getQuestionUiManifest } from '../../shared/question-ui-registry'

export type NodeData = FlowGraphNode & {
  compact?: boolean
  selected?: boolean
  dimmed?: boolean
  hasError?: boolean
  hasWarn?: boolean
}

const handleClass =
  '!size-2 !border-2 !border-card !bg-muted-foreground/50 opacity-0'

const sideHandleClass =
  '!size-2 !border-2 !border-card !bg-muted-foreground/50 opacity-0'

/** 流程节点 · 统一栏宽，内容居中，连线竖直对齐 */
export const GraphNode = memo(function GraphNode({
  data,
}: NodeProps & { data: NodeData }) {
  const compact = data.compact ?? false

  if (data.kind === 'start') {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <div className='border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs leading-none font-medium shadow-xs'>
          开始
        </div>
        <Handle
          type='source'
          position={Position.Bottom}
          id='out-bottom'
          className={handleClass}
        />
        <Handle
          type='source'
          position={Position.Right}
          id='out-right'
          className={sideHandleClass}
        />
      </div>
    )
  }

  if (data.kind === 'end') {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <Handle
          type='target'
          position={Position.Top}
          id='in-top'
          className={handleClass}
        />
        <Handle
          type='target'
          position={Position.Left}
          id='in-left'
          className={sideHandleClass}
        />
        <Handle
          type='target'
          position={Position.Right}
          id='in-right'
          className={sideHandleClass}
        />
        <div className='border-border/70 bg-background text-muted-foreground max-w-full truncate rounded-full border px-3 py-1 text-xs leading-none font-medium shadow-xs'>
          {data.label}
        </div>
      </div>
    )
  }

  const manifest = data.questionType
    ? getQuestionUiManifest(data.questionType as QuestionType)
    : undefined
  const statusText = data.hasError ? '错误' : data.hasWarn ? '警告' : null

  return (
    <div
      className={cn(
        'bg-card flex h-full w-full flex-col rounded-md border shadow-sm transition-all duration-150',
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
      <Handle
        type='target'
        position={Position.Top}
        id='in-top'
        className={handleClass}
      />
      <Handle
        type='target'
        position={Position.Left}
        id='in-left'
        className={sideHandleClass}
      />
      <Handle
        type='target'
        position={Position.Right}
        id='in-right'
        className={sideHandleClass}
      />

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col justify-between',
          compact ? 'gap-1.5 p-2' : 'gap-2 p-2.5'
        )}
      >
        <p
          className={cn(
            'text-foreground min-w-0 font-medium tracking-normal',
            compact
              ? 'line-clamp-2 text-xs leading-[1.35]'
              : 'line-clamp-2 text-sm leading-[1.35]'
          )}
          title={data.label}
        >
          {data.numberLabel ? (
            <span
              className={cn(
                'text-muted-foreground mr-1.5 inline font-medium tabular-nums',
                compact && 'mr-1'
              )}
            >
              {data.numberLabel}
            </span>
          ) : null}
          {data.label}
        </p>

        <div className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px] leading-none'>
          <span className='min-w-0 flex-1 truncate'>
            {manifest?.label ?? '题目'}
          </span>
          <div className='flex shrink-0 items-center gap-1'>
            {data.hasVisibilityRules ? (
              <span
                className='rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700 dark:text-amber-400'
                title='含显隐逻辑'
              >
                显隐
              </span>
            ) : null}
            {data.hasBranchRules ? (
              <span
                className='bg-primary/10 text-primary rounded px-1.5 py-0.5'
                title='含分支逻辑'
              >
                分支
              </span>
            ) : null}
            {statusText ? (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5',
                  data.hasError
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                )}
              >
                {statusText}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        id='out-bottom'
        className={handleClass}
      />
      <Handle
        type='source'
        position={Position.Left}
        id='out-left'
        className={sideHandleClass}
      />
      <Handle
        type='source'
        position={Position.Right}
        id='out-right'
        className={sideHandleClass}
      />
    </div>
  )
})
