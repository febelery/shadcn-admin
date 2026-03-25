import { useState, useEffect, useRef } from 'react'
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
import { CardDragPreview } from './components/drag-preview'
import { SlashCommand } from './components/slash-command'
import { useSurveyDetail } from './hooks/use-survey-detail'
import { PropsPanel } from './layout/panel'
import { TypeSidebar } from './layout/sidebar'
import { BuilderTopbar } from './layout/topbar'
import {
  useSchemaStore,
  useUIStore,
  useFlowStore,
  useDraftStore,
  initBuilderStore,
} from './state'
import type { DragPayload } from './types'
import { SurveyCanvas } from './views/canvas/survey-canvas'
import { FlowPanel } from './views/flow'

export function SurveyBuilder() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })

  const builderMode = useUIStore((s) => s.builderMode)
  const nodes = useSchemaStore((s) => s.nodes)

  const { addNode, reorderNodes } = useSchemaStore()
  const { selectNode, closeSlash } = useUIStore()

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
        initBuilderStore(JSON.parse(draft))
        return
      } catch {
        sessionStorage.removeItem(`survey-draft-${surveyId}`)
      }
    }
    initBuilderStore(surveyData)
  }, [surveyData, surveyId])

  // 自动保存草稿：防抖存储至 sessionStorage
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 监听 Schema 或 Flow 的变更来触发自动保存
    const save = () => {
      const isDirty = useDraftStore.getState().isDirty
      if (!isDirty) return

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        const schema = useSchemaStore.getState()
        const flow = useFlowStore.getState()
        sessionStorage.setItem(
          `survey-draft-${surveyId}`,
          JSON.stringify({
            id: surveyId,
            version: schema.version ?? '1',
            meta: schema.meta,
            nodes: schema.nodes,
            flow: flow.flow,
            validations: flow.validations,
            extensions: schema.extensions ?? {},
          })
        )
      }, 1000)
    }

    const unsubSchema = useSchemaStore.subscribe(save)
    const unsubFlow = useFlowStore.subscribe(save)

    return () => {
      unsubSchema()
      unsubFlow()
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [surveyId])

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
  }, [])

  // 拖拽处理：排序与新增题目
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
    setActiveDragData((active.data.current as DragPayload) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const data = active.data.current as DragPayload | undefined

    if (data?.type === 'NEW_QUESTION') {
      const gapId = over ? String(over.id) : null
      if (!gapId || (!gapId.startsWith('gap-') && gapId !== 'canvas-drop')) {
        addNode(data.questionType)
      } else if (gapId === 'gap-top') {
        addNode(data.questionType, { atTop: true })
      } else if (gapId.startsWith('gap-after-')) {
        addNode(data.questionType, {
          afterId: gapId.slice('gap-after-'.length),
        })
      } else {
        addNode(data.questionType)
      }
    } else if (over && active.id !== over.id) {
      const sortedNodes = [...nodes].sort((a, b) => a.order - b.order)
      const oldIdx = sortedNodes.findIndex((n) => n.id === active.id)
      const newIdx = sortedNodes.findIndex((n) => n.id === over.id)
      if (oldIdx >= 0 && newIdx >= 0) {
        reorderNodes(arrayMove(sortedNodes, oldIdx, newIdx).map((n) => n.id))
      }
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
  )
}
