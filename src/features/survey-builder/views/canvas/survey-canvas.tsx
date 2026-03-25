import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/features/survey-builder/state'
import {
  useRootNodes,
  useQuestionIndexMap,
} from '@/features/survey-builder/state/selectors'
import { QuestionCard } from './question-card'
import { SurveyHeader } from './survey-header'

interface Props {
  isDraggingNew: boolean
}

// 每个节点前渲染一个 gap，列表末尾额外渲染最后一个 gap
function GapDropzone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className='relative z-20 -my-1 py-1' aria-hidden>
      <div
        className={cn(
          'flex items-center transition-opacity duration-200',
          isOver ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className='bg-primary h-2 w-2 shrink-0 rounded-full' />
        <div className='bg-primary/50 h-px flex-1' />
      </div>
    </div>
  )
}

function EmptyCanvasDropzone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'gap-top' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mt-2 flex h-24 items-center justify-center rounded-lg border border-dashed text-sm transition-colors',
        isOver
          ? 'border-primary/50 bg-primary/5 text-primary'
          : 'border-border/60 text-muted-foreground/50'
      )}
    >
      {isOver ? '松开鼠标添加第一道题目' : '拖拽题型到此处或点击下方按钮'}
    </div>
  )
}

export function SurveyCanvas({ isDraggingNew }: Props) {
  const rootNodes = useRootNodes()
  const numMap = useQuestionIndexMap()
  const { openSlash, selectNode } = useUIStore()
  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas-drop' })

  const handleAddClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    openSlash({ x: rect.left, y: rect.bottom + 8 })
  }

  return (
    <main
      ref={setCanvasRef}
      className='bg-muted/20 relative flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 pb-32 md:px-8'
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (
          target === e.currentTarget ||
          target.hasAttribute('data-canvas-bg')
        ) {
          selectNode(null)
        }
      }}
      data-canvas-bg
    >
      <div
        data-canvas-bg
        className='flex w-full max-w-2xl flex-col gap-px transition-all xl:max-w-3xl'
      >
        <SurveyHeader />

        {rootNodes.length === 0 && isDraggingNew && <EmptyCanvasDropzone />}

        <SortableContext
          items={rootNodes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {rootNodes.map((node, index) => {
              // gap-top 在最顶部，其余 gap 命名为 gap-after-{prevNodeId}
              const gapBeforeId =
                index === 0 ? 'gap-top' : `gap-after-${rootNodes[index - 1].id}`

              return (
                <div key={node.id}>
                  {isDraggingNew && <GapDropzone id={gapBeforeId} />}
                  <QuestionCard id={node.id} num={numMap[node.id]} />
                </div>
              )
            })}

            {/* 最后一个节点之后的插入区 */}
            {isDraggingNew && rootNodes.length > 0 && (
              <GapDropzone
                id={`gap-after-${rootNodes[rootNodes.length - 1].id}`}
              />
            )}
          </div>
        </SortableContext>

        {!isDraggingNew && (
          <div className='mt-4'>
            <button
              onClick={handleAddClick}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border border-dashed',
                'border-border/40 px-4 py-3 text-left',
                'text-muted-foreground/60 transition-all duration-200',
                'hover:border-border/80 hover:bg-background hover:text-foreground',
                'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none'
              )}
            >
              <div className='bg-muted group-hover:bg-primary/10 group-hover:text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors'>
                <Badge
                  variant='outline'
                  className='border-transparent p-0 shadow-none'
                >
                  +
                </Badge>
              </div>
              <span className='flex-1 text-sm font-medium'>添加问题</span>
              <span className='text-muted-foreground/50 font-mono text-xs'>
                +/Drag
              </span>
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
