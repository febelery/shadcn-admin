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
import { useShallow } from 'zustand/react/shallow'
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

  // 架构优化: 避免直接解构庞大的 Store，改用原子级 Selector 或 Shallow 控制渲染边界
  const builderMode = useBuilderStore((s) => s.builderMode)
  const nodes = useBuilderStore((s) => s.nodes)

  const { initSurvey, addNode, reorderNodes } = useBuilderStore(
    useShallow((s) => ({
      initSurvey: s.initSurvey,
      addNode: s.addNode,
      reorderNodes: s.reorderNodes,
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
        initSurvey(JSON.parse(draft))
        return
      } catch (e) {
        console.error('Failed to parse survey draft:', e)
      }
    }
    initSurvey(surveyData)
  }, [surveyData, surveyId, initSurvey])

  // 自动保存草稿 - 采用 Subscribe 真正响应所有的状态变动，而不会陷入 isDirty useEffect 的死结
  useEffect(() => {
    const unsub = useBuilderStore.subscribe((state, prevState) => {
      // 检查只要是脏状态且状态发生了变化，就推入延迟保存
      if (state.isDirty && state !== prevState) {
        clearTimeout((window as any)._surveyAutoSaveTimer)
        ;(window as any)._surveyAutoSaveTimer = setTimeout(() => {
          sessionStorage.setItem(
            `survey-draft-${surveyId}`,
            JSON.stringify({
              id: surveyId,
              version: state.version || '1',
              meta: state.meta,
              nodes: state.nodes,
              logic: state.logic,
              validations: state.validations,
              extensions: state.extensions || {},
            })
          )
        }, 1000)
      }
    })
    return () => unsub()
  }, [surveyId])

  // 全局快捷键
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // 架构防护: 如果焦点在输入框/文本域等原生编辑容器中，将键盘操作归还浏览器，禁止拦截
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInput) return

      const store = useBuilderStore.getState()
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
      // 重排现有节点
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
