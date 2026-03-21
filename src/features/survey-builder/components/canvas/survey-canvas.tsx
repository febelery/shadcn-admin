import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useBuilderStore, useRootNodes } from '@/features/survey-builder/store'
import { QuestionCard } from './question-card'
import { SurveyHeader } from './survey-header'

interface Props {
  isDraggingNew: boolean
}

/**
 * GapDropzone —— 卡片之间的插入热区
 *
 * 核心思路：每个 gap 是一个真实的 droppable，高度平时很小（用户感知不到），
 * 悬停时展示指示线。因为是真实 droppable，dnd-kit 直接告诉我们
 * "放在哪个 gap"，不需要自己根据鼠标 Y 坐标推算 before/after。
 *
 * padding 技巧：把可点击区域（paddingY）做大，但把可视线条做薄，
 * 这样用户不需要精确瞄准，但视觉上干净。
 */
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

/** 列表为空时的整块投放区 */
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
  const { openSlash, selectNode } = useBuilderStore()

  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas-drop' })

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    openSlash({ x: rect.left, y: rect.bottom + 8 })
  }

  return (
    <main
      ref={setCanvasRef}
      className='bg-muted/20 relative flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 pb-32 md:px-8'
      onClick={() => selectNode(null)}
    >
      <div className='flex w-full max-w-2xl flex-col gap-px transition-all xl:max-w-3xl'>
        <SurveyHeader />

        {rootNodes.length === 0 && isDraggingNew && <EmptyCanvasDropzone />}

        <SortableContext
          items={rootNodes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {rootNodes.map((node, index) => {
              const topGapId =
                index === 0 ? 'gap-top' : `gap-after-${rootNodes[index - 1].id}`
              const bottomGapId = `gap-after-${node.id}`

              return (
                <div key={node.id}>
                  {isDraggingNew && <GapDropzone id={topGapId} />}

                  <QuestionCard node={node} />

                  {isDraggingNew && index === rootNodes.length - 1 && (
                    <GapDropzone id={bottomGapId} />
                  )}
                </div>
              )
            })}
          </div>
        </SortableContext>

        {!isDraggingNew && (
          <div className='mt-4' onClick={(e) => e.stopPropagation()}>
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
              <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted shadow-sm transition-colors group-hover:bg-primary/10 group-hover:text-primary'>
                <Badge
                  variant='outline'
                  className='border-transparent p-0 shadow-none'
                >
                  +
                </Badge>
              </div>
              <span className='flex-1 text-sm font-medium'>添加问题</span>
              <span className='text-xs text-muted-foreground/50 font-mono'>
                +/Drag
              </span>
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
