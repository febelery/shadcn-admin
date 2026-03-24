import { getQuestion } from '@/features/survey-builder/questions'
import { useBuilderStore } from '@/features/survey-builder/state'
import type { DragPayload } from '@/features/survey-builder/types'

interface Props {
  data: DragPayload | null
  nodeId?: string
}

export function CardDragPreview({ data, nodeId }: Props) {
  const { nodes } = useBuilderStore()

  // 侧边栏新题型拖拽预览
  if (data?.type === 'NEW_QUESTION') {
    const meta = getQuestion(data.questionType)?.meta
    const Icon = meta?.icon

    return (
      <div className='bg-background border-border ring-primary/15 w-56 rotate-1 overflow-hidden rounded-lg border p-3 shadow-2xl ring-1'>
        <div className='flex items-center gap-2.5'>
          {Icon && (
            <div className='bg-primary/8 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md'>
              <Icon className='h-4 w-4' />
            </div>
          )}
          <div>
            <p className='text-foreground text-xs font-semibold'>
              {meta?.label}
            </p>
            <p className='text-muted-foreground text-[10px]'>
              {meta?.description}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 现有题目重排拖拽预览
  if (nodeId) {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return null

    const meta = getQuestion(node.type)?.meta

    return (
      <div className='border-border bg-background w-72 rotate-[0.5deg] rounded-lg border p-3 opacity-95 shadow-2xl'>
        <div className='mb-1 flex items-center gap-1.5'>
          <span className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[9px] font-bold'>
            {meta?.label}
          </span>
        </div>
        <p className='text-foreground line-clamp-2 text-sm font-medium'>
          {node.title || '（未命名）'}
        </p>
      </div>
    )
  }

  return null
}
