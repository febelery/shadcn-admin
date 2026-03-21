import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import { useSurveyDetail } from '../hooks'
import { useBuilderStore } from '../store'
import type { DragPayload } from '../types'
import { BuilderTopbar } from './builder-topbar'
import { CardDragPreview } from './canvas/drag-overlay'
import { SlashCommand } from './canvas/slash-command'
import { SurveyCanvas } from './canvas/survey-canvas'
import { LogicPanel } from './logic/logic-panel'
import { PropsPanel } from './panel/props-panel'
import { TypeSidebar } from './type-sidebar'

export function SurveyBuilder() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })
  const { builderMode, initSurvey, isDirty, addNode, reorderNodes, nodes } =
    useBuilderStore()

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [activeDragData, setActiveDragData] = useState<DragPayload | null>(null)

  const { data: surveyData, isLoading } = useSurveyDetail(surveyId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // 数据初始化
  useEffect(() => {
    if (!surveyData) return
    const draft = sessionStorage.getItem(`survey-draft-${surveyId}`)
    if (draft) {
      try {
        initSurvey(JSON.parse(draft))
        return
      } catch (e) {
        console.error('Failed to parse survey draft:', e)
      }
    }
    initSurvey(surveyData)
  }, [surveyData, surveyId, initSurvey])

  // 自动保存草稿
  useEffect(() => {
    if (!isDirty) return
    const t = setTimeout(() => {
      const s = useBuilderStore.getState()
      sessionStorage.setItem(
        `survey-draft-${surveyId}`,
        JSON.stringify({
          id: surveyId,
          version: s.version || '1',
          meta: s.meta,
          nodes: s.nodes,
          logic: s.logic,
          validations: s.validations,
          extensions: s.extensions || {},
        })
      )
    }, 1000)
    return () => clearTimeout(t)
  }, [isDirty, surveyId])

  // 全局快捷键
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const store = useBuilderStore.getState()
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || (e.shiftKey && e.key === 'z'))
      ) {
        e.preventDefault()
        store.redo()
      }
      if (e.key === 'Escape') {
        store.selectNode(null)
        store.closeSlash()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  // 拖拽手势处理
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
    setActiveDragData((active.data.current as DragPayload) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const data = active.data.current

    if (data?.type === 'NEW_QUESTION') {
      const gapId = over ? String(over.id) : null

      if (!gapId || (!gapId.startsWith('gap-') && gapId !== 'canvas-drop')) {
        // 落到画布空白区域 → 追加到末尾
        addNode(data.questionType)
      } else if (gapId === 'gap-top') {
        addNode(data.questionType, { atTop: true })
      } else if (gapId.startsWith('gap-after-')) {
        const afterId = gapId.slice('gap-after-'.length)
        addNode(data.questionType, { afterId })
      } else {
        // canvas-drop fallback
        addNode(data.questionType)
      }
    } else if (over && active.id !== over.id) {
      // 重排现有节点 —— over 指向的是卡片 id（SortableContext item）
      const rootNodes = nodes
        .filter((n) => !n.parentId)
        .sort((a, b) => a.order - b.order)
      const oldIdx = rootNodes.findIndex((n) => n.id === active.id)
      const newIdx = rootNodes.findIndex((n) => n.id === over.id)
      if (oldIdx >= 0 && newIdx >= 0) {
        reorderNodes(arrayMove(rootNodes, oldIdx, newIdx).map((n) => n.id))
      }
    }

    setActiveId(null)
    setActiveDragData(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveDragData(null)
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className='bg-background flex h-screen w-full items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='text-primary h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm font-medium'>
            加载问卷设计器...
          </p>
        </div>
      </div>
    )
  }

  const isDraggingNew = activeDragData?.type === 'NEW_QUESTION'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className='bg-background flex h-screen flex-col overflow-hidden'>
        <BuilderTopbar />

        <div className='flex flex-1 overflow-hidden'>
          {builderMode === 'build' ? (
            <>
              <TypeSidebar />
              <SurveyCanvas isDraggingNew={isDraggingNew} />
              <PropsPanel />
            </>
          ) : (
            <LogicPanel />
          )}
        </div>

        <SlashCommand />
      </div>

      {/* Drag overlay – visual preview under cursor */}
      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeId ? (
          <CardDragPreview
            data={activeDragData}
            nodeId={
              activeDragData?.type !== 'NEW_QUESTION'
                ? String(activeId)
                : undefined
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
