import { memo, type CSSProperties, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Editor } from '@/components/ui/editor'
import { Separator } from '@/components/ui/separator'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveyElement,
} from '../../core/types'
import { QUESTION_REQUIRED_TOGGLE_ATTR } from '../../shared/question-required-mark'
import { SurfaceQuestionBlock } from '../question-surface/question-block'
import { QUESTION_NUMBER_TOGGLE_ATTR } from '../question-surface/question-number-toggle'
import { useBuilderStore } from '../store'
import { builderQuestionBlockClass, builderQuestionBodyPad, builderTypeBody, builderTypeCaption } from '../ui'
import {
  WorkspaceQuestionActions,
  type QuestionDragHandleProps,
} from './question-actions'
import { BUILDER_WORKSPACE_TARGET_ATTR } from './workspace-scroll'

type Props = {
  sectionId: string
  element: SurveyElement
  selected: boolean
  dimmed?: boolean
  /** 以下仅 kind=question 时使用 */
  globalOrdinal?: number
  displayOrdinal?: number | null
  numberingMode?: QuestionNumberingMode
  surveyDefaultNumbering?: SurveyDefaultNumberingStyle
}

function QuestionBlock({
  sectionId,
  element,
  selected,
  dimmed,
  dragging,
  setNodeRef,
  style,
  drag,
  children,
}: {
  sectionId: string
  element: SurveyElement
  selected: boolean
  dimmed?: boolean
  dragging: boolean
  setNodeRef: (node: HTMLElement | null) => void
  style: CSSProperties
  drag: QuestionDragHandleProps
  children: ReactNode
}) {
  return (
    <article
      ref={setNodeRef}
      style={style}
      className={builderQuestionBlockClass({ selected, dragging, dimmed })}
      {...{ [BUILDER_WORKSPACE_TARGET_ATTR]: element.id }}
      onPointerDownCapture={(e) => {
        if (e.button !== 0) return
        const target = e.target as HTMLElement
        if (target.closest(`[${QUESTION_REQUIRED_TOGGLE_ATTR}]`)) return
        if (target.closest(`[${QUESTION_NUMBER_TOGGLE_ATTR}]`)) return
        useBuilderStore.getState().select(sectionId, element.id)
      }}
    >
      <div className={cn(builderQuestionBodyPad, 'min-w-0')}>{children}</div>
      <WorkspaceQuestionActions
        sectionId={sectionId}
        element={element}
        selected={selected}
        drag={drag}
      />
    </article>
  )
}

export const WorkspaceElementCard = memo(
  function WorkspaceElementCard({
    sectionId,
    element,
    selected,
    dimmed,
    globalOrdinal = 1,
    displayOrdinal = null,
    numberingMode = 'global',
    surveyDefaultNumbering = 'decimal',
  }: Props) {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: element.id })

    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const drag: QuestionDragHandleProps = {
      setActivatorNodeRef,
      attributes,
      listeners,
    }

    if (element.kind === 'divider') {
      return (
        <QuestionBlock
          sectionId={sectionId}
          element={element}
          selected={selected}
          dimmed={dimmed}
          dragging={isDragging}
          setNodeRef={setNodeRef}
          style={style}
          drag={drag}
        >
          <Separator className='my-1' />
        </QuestionBlock>
      )
    }

    if (element.kind === 'html_block') {
      return (
        <QuestionBlock
          sectionId={sectionId}
          element={element}
          selected={selected}
          dimmed={dimmed}
          dragging={isDragging}
          setNodeRef={setNodeRef}
          style={style}
          drag={drag}
        >
          <div data-surface-chrome className='min-w-0'>
            <Editor
              variant='plain'
              value={element.html}
              onChange={(html) =>
                useBuilderStore
                  .getState()
                  .updateHtmlBlock(sectionId, element.id, { html })
              }
              placeholder='输入说明内容…'
              className='border-none shadow-none focus-within:ring-0 focus-within:ring-offset-0'
            />
          </div>
        </QuestionBlock>
      )
    }

    if (element.kind === 'panel') {
      return (
        <QuestionBlock
          sectionId={sectionId}
          element={element}
          selected={selected}
          dimmed={dimmed}
          dragging={isDragging}
          setNodeRef={setNodeRef}
          style={style}
          drag={drag}
        >
          <p className={cn(builderTypeBody, 'text-muted-foreground')}>
            {element.title?.trim() || '题目分组'}
            <span className={cn(builderTypeCaption, 'ml-1.5 opacity-70')}>
              （{element.elements.length} 项）
            </span>
          </p>
        </QuestionBlock>
      )
    }

    if (element.kind !== 'question') return null

    return (
      <QuestionBlock
        sectionId={sectionId}
        element={element}
        selected={selected}
        dimmed={dimmed}
        dragging={isDragging}
        setNodeRef={setNodeRef}
        style={style}
        drag={drag}
      >
        <SurfaceQuestionBlock
          question={element}
          displayOrdinal={displayOrdinal}
          globalOrdinal={globalOrdinal}
          numberingMode={numberingMode}
          surveyDefaultNumbering={surveyDefaultNumbering}
          selected={selected}
          onPatch={(patch) =>
            useBuilderStore
              .getState()
              .updateQuestion(sectionId, element.id, patch)
          }
          onConfigChange={(patch) =>
            useBuilderStore
              .getState()
              .updateQuestionConfig(sectionId, element.id, patch)
          }
        />
      </QuestionBlock>
    )
  },
  (prev, next) =>
    prev.sectionId === next.sectionId &&
    prev.element === next.element &&
    prev.selected === next.selected &&
    prev.dimmed === next.dimmed &&
    prev.globalOrdinal === next.globalOrdinal &&
    prev.displayOrdinal === next.displayOrdinal &&
    prev.numberingMode === next.numberingMode &&
    prev.surveyDefaultNumbering === next.surveyDefaultNumbering
)
