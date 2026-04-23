import React from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getQuestion } from '@/features/survey-builder/questions'
import { useUIStore } from '@/features/survey-builder/state'
import {
  useRootNodes,
  useQuestionIndexMap,
} from '@/features/survey-builder/state/selectors'
import { type DragPayload } from '@/features/survey-builder/types'
import { QuestionCard } from './question-card'
import { SurveyHeader } from './survey-header'

// 丝滑动画占位符
function SmoothPlaceholder({ show, type }: { show: boolean; type?: string }) {
  const q = type ? getQuestion(type) : null
  const Icon = q?.meta.icon

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        show ? 'h-[90px] opacity-100' : 'h-0 opacity-0'
      )}
    >
      <div
        className={cn(
          'bg-primary/2 border-border/20 border-l-primary/30 relative flex h-full items-center border-b border-l-4 transition-all duration-300',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-[2px]'
        )}
      >
        <div className='flex items-center gap-4 px-8'>
          <div className='bg-primary/10 flex size-8 items-center justify-center rounded-lg shadow-inner'>
            {Icon && <Icon className='text-primary size-4 opacity-70' />}
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='text-primary/60 text-[11px] font-bold tracking-widest uppercase'>
              {q?.meta.label}
            </span>
            <span className='text-muted-foreground/40 text-xs font-medium'>
              松开鼠标以插入此类型的题目
            </span>
          </div>
        </div>

        {/* 右侧装饰性骨架，匹配 Card 的右侧操作区感 */}
        <div className='mr-8 ml-auto hidden items-center gap-2 opacity-5 sm:flex'>
          <div className='bg-muted h-6 w-6 rounded-md' />
          <div className='bg-muted h-6 w-6 rounded-md' />
        </div>
      </div>
    </div>
  )
}

export function SurveyCanvas({ isDraggingNew }: { isDraggingNew: boolean }) {
  const rootNodes = useRootNodes()
  const numMap = useQuestionIndexMap()
  const { openSlash, selectNode } = useUIStore()

  // 整个画布作为默认的放置区
  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas-core' })
  const { active, over } = useDndContext()

  const handleAddClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    openSlash({ x: rect.left, y: rect.bottom + 8 })
  }

  const activeData = active?.data.current as DragPayload | undefined

  // 精准计算占位符应该出现的索引位置
  let dropIndex = -1
  if (isDraggingNew && over) {
    if (over.id === 'canvas-core') {
      dropIndex = rootNodes.length
    } else {
      dropIndex = rootNodes.findIndex((n) => n.id === over.id)
    }
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

        <SortableContext
          items={rootNodes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='flex flex-col gap-px'>
            {rootNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* 占位符渲染在被悬停目标的前面 */}
                <SmoothPlaceholder
                  show={isDraggingNew && dropIndex === index}
                  type={
                    activeData?.type === 'NEW_QUESTION'
                      ? activeData.questionType
                      : undefined
                  }
                />
                <QuestionCard id={node.id} num={numMap[node.id]} />
              </React.Fragment>
            ))}
            {/* 如果拖到最末尾（或空白处），在最后显示占位符 */}
            <SmoothPlaceholder
              show={isDraggingNew && dropIndex === rootNodes.length}
              type={
                activeData?.type === 'NEW_QUESTION'
                  ? activeData.questionType
                  : undefined
              }
            />
          </div>
        </SortableContext>

        {!isDraggingNew && (
          <div className='mt-4'>
            <button
              onClick={handleAddClick}
              className={cn(
                'group border-border/40 text-muted-foreground/60 hover:border-border/80 hover:bg-background hover:text-foreground focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none'
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
