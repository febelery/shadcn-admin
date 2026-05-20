import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { LucideIcon } from 'lucide-react'
import { GripVertical } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useBuilderStatic } from '../context'
import { useBuilderStore } from '../store'
import type { QuestionType } from '../types'

// ─── DnD 类型常量（原 builder/dnd.ts）─────────────────────────────────────────

export const PALETTE_DRAG = 'palette-question'
export const WORKSPACE_DROP = 'workspace-drop'

export type PaletteDragData = {
  type: typeof PALETTE_DRAG
  questionType?: QuestionType
  layoutType?: 'divider' | 'html_block'
}

/** 题目之间的插入投放位 */
export const INSERT_DROP = 'workspace-insert'

export type InsertDropData = {
  type: typeof INSERT_DROP
  sectionId: string
  index: number
}

// ─── DnD Provider ─────────────────────────────────────────────────────────────

type PaletteDragPreviewProps = {
  label: string
  icon: LucideIcon
  className?: string
}

function PaletteDragPreview({
  label,
  icon: Icon,
  className,
}: PaletteDragPreviewProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(
        'bg-background text-foreground border-border pointer-events-none flex h-9 w-36 cursor-grabbing items-center gap-2 rounded-md border px-2 shadow-lg',
        className
      )}
      {...(reducedMotion
        ? {}
        : {
            initial: { opacity: 0.88, scale: 0.97 },
            animate: { opacity: 1, scale: 1 },
            transition: {
              duration: 0.16,
              ease: [0.25, 0.1, 0.25, 1],
            },
          })}
    >
      <span className='bg-muted text-foreground border-border/50 group-hover:border-border group-hover:bg-accent group-hover:text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors'>
        <Icon className='size-3.5' />
      </span>
      <span className='min-w-0 flex-1 truncate text-xs leading-none font-medium'>
        {label}
      </span>
    </motion.div>
  )
}

type ActiveDrag =
  | { kind: 'palette'; label: string; icon: LucideIcon }
  | { kind: 'element'; label: string }
  | null

const ActiveDragCtx = createContext<ActiveDrag>(null)

/** 低频：仅在拖拽开始/结束时变化 */
export function useActiveDrag() {
  return useContext(ActiveDragCtx)
}

/** 是否正在从题型库拖入（用于画布 dimmed 等） */
export function useIsPaletteDragging() {
  const activeDrag = useActiveDrag()
  return activeDrag?.kind === 'palette'
}

const workspaceCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  const insertHits = pointerHits.filter(
    (c) => c.data?.droppableContainer?.data?.current?.type === INSERT_DROP
  )
  if (insertHits.length > 0) return insertHits
  return closestCenter(args)
}

type Props = {
  sectionId: string | null
  children: ReactNode
}

export function BuilderDndProvider({ sectionId, children }: Props) {
  const { getQuestionManifest, LAYOUT_MANIFESTS } = useBuilderStatic()
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const resetDragState = () => {
    setActiveDrag(null)
  }

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as PaletteDragData | undefined
    if (data?.type === PALETTE_DRAG) {
      if (data.questionType) {
        const m = getQuestionManifest(data.questionType as QuestionType)
        if (m) {
          setActiveDrag({ kind: 'palette', label: m.label, icon: m.icon })
          return
        }
      }
      if (data.layoutType) {
        const m = LAYOUT_MANIFESTS.find((x: any) => x.type === data.layoutType)
        if (m) {
          setActiveDrag({ kind: 'palette', label: m.label, icon: m.icon })
          return
        }
      }
      setActiveDrag({ kind: 'palette', label: '题型', icon: GripVertical })
      return
    }
    setActiveDrag({ kind: 'element', label: '调整顺序' })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    resetDragState()
    if (!over || !sectionId) return

    const activeData = active.data.current as PaletteDragData | undefined
    const store = useBuilderStore.getState()
    const section = store.schema?.sections.find((s) => s.id === sectionId)
    if (!section) return

    if (activeData?.type === PALETTE_DRAG) {
      const overData = over.data.current as InsertDropData | undefined
      const overId = String(over.id)
      let index = section.elements.length

      if (overData?.type === INSERT_DROP) {
        index = overData.index
      } else if (!overId.startsWith('workspace-drop-')) {
        const overIndex = section.elements.findIndex((e) => e.id === overId)
        if (overIndex >= 0) index = overIndex
      }

      if (activeData.questionType) {
        store.addQuestion(
          sectionId,
          activeData.questionType as QuestionType,
          index
        )
      } else if (activeData.layoutType) {
        store.addLayout(sectionId, activeData.layoutType, index)
      }
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId !== overId && !overId.startsWith('workspace-drop-')) {
      store.reorderElements(sectionId, activeId, overId)
    }
  }

  const onDragCancel = () => resetDragState()

  return (
    <ActiveDragCtx value={activeDrag}>
      <DndContext
        sensors={sensors}
        collisionDetection={workspaceCollisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeDrag?.kind === 'palette' ? (
            <PaletteDragPreview
              label={activeDrag.label}
              icon={activeDrag.icon}
            />
          ) : activeDrag?.kind === 'element' ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='pointer-events-none cursor-grabbing shadow-md'
            >
              <GripVertical />
              {activeDrag.label}
            </Button>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ActiveDragCtx>
  )
}
