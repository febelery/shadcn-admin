import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useBuilderStore, useRootNodes } from '@/features/survey-builder/store'
import { BlockHeader } from './block-header'
import { QuestionCard } from './question-card'
import { SurveyHeader } from './survey-header'

interface Props {
  isDraggingNew: boolean
  /** 当前悬停的 gap droppable id，由父级传入 */
  dropGapId: string | null
}

/**
 * GapDropzone —— 卡片之间的插入热区
 *
 * 核心思路：每个 gap 是一个真实的 droppable，高度平时很小（用户感知不到），
 * 悬停时展示蓝色指示线。因为是真实 droppable，dnd-kit 直接告诉我们
 * "放在哪个 gap"，不需要自己根据鼠标 Y 坐标推算 before/after。
 *
 * padding 技巧：把可点击区域（paddingY）做大，但把可视线条做薄，
 * 这样用户不需要精确瞄准，但视觉上干净。
 */
function GapDropzone({ id }: { id: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      // 负 margin 让 gap 与上下卡片轻微重叠，扩大命中区
      className='relative z-20 -my-2 py-2'
      aria-hidden
    >
      {/* 可视指示线，仅悬停时出现 */}
      <div
        className={cn(
          'flex items-center transition-opacity duration-100',
          isOver ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className='bg-primary h-2.5 w-2.5 shrink-0 rounded-full shadow-sm' />
        <div className='bg-primary/60 h-0.5 flex-1' />
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
        'mt-2 flex h-24 items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium transition-colors',
        isOver
          ? 'border-primary/60 bg-primary/8 text-primary'
          : 'border-border/40 text-muted-foreground/50'
      )}
    >
      {isOver ? '松开鼠标添加第一道题目' : '拖拽题型到此处'}
    </div>
  )
}

export function SurveyCanvas({ isDraggingNew, dropGapId }: Props) {
  const rootNodes = useRootNodes()
  const { openSlash, selectNode } = useBuilderStore()

  // 画布背景仍然是 droppable，作为最后的 fallback（追加到末尾）
  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas-drop' })

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    openSlash({ x: rect.left, y: rect.bottom + 8 })
  }

  return (
    <main
      ref={setCanvasRef}
      className='bg-secondary/50 relative flex flex-1 flex-col items-center overflow-y-auto px-4 py-6 pb-20 md:px-8'
      onClick={() => selectNode(null)}
    >
      <div className='w-full max-w-2xl transition-all xl:max-w-3xl'>
        {/* Survey header / cover */}
        <SurveyHeader />

        {/* 空列表：整块投放区 */}
        {rootNodes.length === 0 && isDraggingNew && <EmptyCanvasDropzone />}

        {/* 题目列表 */}
        <SortableContext
          items={rootNodes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {rootNodes.map((node, index) => {
              // 每个卡片上方有一个 gap（第一个卡片上方用 gap-top）
              const topGapId =
                index === 0 ? 'gap-top' : `gap-after-${rootNodes[index - 1].id}`
              // 每个卡片下方也有一个 gap（即下一个卡片的上方 gap，最后一个独立设置）
              const bottomGapId = `gap-after-${node.id}`

              return (
                <div key={node.id}>
                  {/* ── 卡片上方的 Gap（仅拖拽新题时渲染） ── */}
                  {isDraggingNew && (
                    <GapDropzone
                      id={topGapId}
                      isActive={dropGapId === topGapId}
                    />
                  )}

                  {node.type === 'block' ? (
                    <BlockHeader node={node} />
                  ) : (
                    <QuestionCard node={node} />
                  )}

                  {/* ── 最后一个卡片额外渲染下方 Gap ── */}
                  {isDraggingNew && index === rootNodes.length - 1 && (
                    <GapDropzone
                      id={bottomGapId}
                      isActive={dropGapId === bottomGapId}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </SortableContext>

        {/* ── 内联添加按钮（非拖拽时显示） ── */}
        {!isDraggingNew && (
          <div className='mt-3' onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleAddClick}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border border-dashed',
                'border-border/40 px-4 py-3 text-left',
                'text-muted-foreground/60 transition-all duration-150',
                'hover:border-border/80 hover:bg-background/60 hover:text-muted-foreground',
                'focus:ring-ring/50 focus:ring-2 focus:outline-none'
              )}
            >
              <Badge
                variant='outline'
                className='border-border/50 text-muted-foreground/50 group-hover:border-foreground/30 group-hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full border p-0 text-xs font-medium transition-all shadow-none'
              >
                +
              </Badge>
              <span className='flex-1 text-xs font-medium'>点击添加问题</span>
              <span className='text-muted-foreground/30 font-mono text-[10px]'>
                ⌘K · /
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 键盘快捷键提示 */}
      <div className='from-secondary/40 pointer-events-none fixed right-0 bottom-0 left-0 z-10 flex h-9 items-end justify-center bg-linear-to-t to-transparent'>
        <div className='flex items-center gap-4 pb-2'>
          {[
            ['⌘K', '添加'],
            ['⌘Z', '撤销'],
            ['⌘⇧Z', '重做'],
            ['Esc', '取消选中'],
          ].map(([k, v]) => (
            <span
              key={k}
              className='text-muted-foreground/30 flex items-center gap-1 text-[10px]'
            >
              <kbd className='border-border/30 bg-background/70 rounded border px-1 py-0.5 font-mono text-[9px]'>
                {k}
              </kbd>
              {v}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
