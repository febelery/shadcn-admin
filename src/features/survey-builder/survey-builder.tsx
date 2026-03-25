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
import { Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CardDragPreview } from './components/drag-preview'
import { SlashCommand } from './components/slash-command'
import { useAutoSave } from './hooks/use-auto-save'
import { useSurveyDetail } from './hooks/use-survey-detail'
import { PropsPanel } from './layout/panel'
import { TypeSidebar } from './layout/sidebar'
import { BuilderTopbar } from './layout/topbar'
import { useSchemaStore, useUIStore, initializeSurveyBuilder } from './state'
import type { DragPayload } from './types'
import { SurveyCanvas } from './views/canvas/survey-canvas'
import { FlowPanel } from './views/flow'

export function SurveyBuilder() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })

  const builderMode = useUIStore((s) => s.builderMode)
  const { addNode, moveNode } = useSchemaStore(
    useShallow((s) => ({
      addNode: s.addNode,
      moveNode: s.moveNode,
    }))
  )
  const { selectNode, closeSlash } = useUIStore(
    useShallow((s) => ({
      selectNode: s.selectNode,
      closeSlash: s.closeSlash,
    }))
  )

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
        initializeSurveyBuilder(JSON.parse(draft))
        return
      } catch {
        sessionStorage.removeItem(`survey-draft-${surveyId}`)
      }
    }
    initializeSurveyBuilder(surveyData)
  }, [surveyData, surveyId])

  // 自动保存草稿
  useAutoSave(surveyId)

  // 全局快捷键：Esc 取消选中/关闭菜单
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      if (isEditing) return

      if (e.key === 'Escape') {
        selectNode(null)
        closeSlash()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [closeSlash, selectNode])

  // 拖拽处理：排序与新增题目
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
    setActiveDragData((active.data.current as DragPayload) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const data = active.data.current as DragPayload | undefined
    const nodes = useSchemaStore.getState().nodes

    if (data?.type === 'NEW_QUESTION') {
      const overId = over?.id ? String(over.id) : null

      if (!overId || overId === 'canvas-core') {
        // 拖到空白处，默认加到最后
        addNode(data.questionType)
      } else {
        // 拖到某个节点上
        const overIndex = nodes.findIndex((n) => n.id === overId)
        if (overIndex === 0) {
          addNode(data.questionType, { atTop: true })
        } else if (overIndex > 0) {
          addNode(data.questionType, { afterId: nodes[overIndex - 1].id })
        } else {
          addNode(data.questionType)
        }
      }
    } else if (over && active.id !== over.id) {
      moveNode(active.id as string, over.id as string)
    }

    setActiveId(null)
    setActiveDragData(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveDragData(null)
  }

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
    <TooltipProvider>
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
              <FlowPanel />
            )}
          </div>

          <SlashCommand />
        </div>

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
    </TooltipProvider>
  )
}
