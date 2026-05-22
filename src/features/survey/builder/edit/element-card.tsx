import { memo, type CSSProperties, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Editor } from '@/components/ui/editor'
import { Separator } from '@/components/ui/separator'
import { useIsPaletteDragging } from '../shared/dnd-provider'
import { useBuilderStore } from '../store'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveyElement,
} from '../types'
import { QuestionLogicBadges } from './logic/question-logic-badges'
import {
  WorkspaceQuestionActions,
  type QuestionDragHandleProps,
} from './question-actions'
import { SurfaceQuestionBlock } from './question-surface/question-block'
import { QUESTION_NUMBER_TOGGLE_ATTR } from './question-surface/question-number-toggle'
import { BUILDER_WORKSPACE_TARGET_ATTR } from './workspace-scroll'

const QUESTION_REQUIRED_TOGGLE_ATTR = 'data-question-required-toggle'

type Props = {
  sectionId: string
  element: SurveyElement
  selected: boolean
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
  dimmed: boolean
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
      className={cn(
        'group/question relative rounded-lg border border-transparent',
        'transition-[background-color,border-color,box-shadow,opacity] duration-150',
        selected
          ? 'border-border/50 bg-background before:bg-primary shadow-sm before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-0.5 before:rounded-r before:content-[""]'
          : 'hover:bg-muted/30',
        dragging && 'opacity-40',
        dimmed && !dragging && 'opacity-35'
      )}
      {...{ [BUILDER_WORKSPACE_TARGET_ATTR]: element.id }}
      onPointerDownCapture={(e) => {
        if (e.button !== 0) return
        const target = e.target as HTMLElement
        if (target.closest(`[${QUESTION_REQUIRED_TOGGLE_ATTR}]`)) return
        if (target.closest(`[${QUESTION_NUMBER_TOGGLE_ATTR}]`)) return
        useBuilderStore.getState().select(sectionId, element.id)
      }}
    >
      <div className='min-w-0 px-3.5 py-3 pr-11'>{children}</div>
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

    const dimmed = useIsPaletteDragging()

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
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {element.title?.trim() || '题目分组'}
            <span className='text-muted-foreground ml-1.5 text-xs leading-relaxed opacity-70'>
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
        <QuestionLogicBadges questionId={element.id} className='mb-2' />
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
    prev.globalOrdinal === next.globalOrdinal &&
    prev.displayOrdinal === next.displayOrdinal &&
    prev.numberingMode === next.numberingMode &&
    prev.surveyDefaultNumbering === next.surveyDefaultNumbering
)
