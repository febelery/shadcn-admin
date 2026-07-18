import { memo, useCallback, type CSSProperties, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  buildQuestionOrdinalMap,
  buildQuestionDisplayOrdinalMap,
  getQuestionNumberingMode,
  getSurveyDefaultNumberingStyle,
} from '../../shared/question-numbering'
import { RichTextEditor } from '../../shared/rich-text-editor'
import { useIsPaletteDragging } from '../shared/dnd-provider'
import { useBuilderStore, useBuilderStoreApi } from '../store'
import type { SurveyElement } from '../types'
import { QuestionLogicBadges } from './logic/question-logic-badges'
import {
  WorkspaceQuestionActions,
  type QuestionDragHandleProps,
} from './question-actions'
import { SurfaceQuestionBlock } from './question-surface/question-block'
import { QUESTION_NUMBER_TOGGLE_ATTR } from './question-surface/question-number-toggle'
import { scrollIntoWorkspaceView } from './workspace-scroll'

const QUESTION_REQUIRED_TOGGLE_ATTR = 'data-question-required-toggle'

type Props = {
  sectionId: string
  element: SurveyElement
  selected: boolean
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
  const store = useBuilderStoreApi()
  const attachNode = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node)
      if (node && selected) scrollIntoWorkspaceView(node)
    },
    [selected, setNodeRef]
  )

  return (
    <article
      ref={attachNode}
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
      onPointerDownCapture={(e) => {
        if (e.button !== 0) return
        const target = e.target as HTMLElement
        if (target.closest(`[${QUESTION_REQUIRED_TOGGLE_ATTR}]`)) return
        if (target.closest(`[${QUESTION_NUMBER_TOGGLE_ATTR}]`)) return
        store.getState().select(sectionId, element.id)
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

export const WorkspaceElementCard = memo(function WorkspaceElementCard({
  sectionId,
  element,
  selected,
}: Props) {
  const store = useBuilderStoreApi()
  const globalOrdinal = useBuilderStore(
    (s) => buildQuestionOrdinalMap(s.document).get(element.id) ?? 1
  )
  const displayOrdinal = useBuilderStore(
    (s) => buildQuestionDisplayOrdinalMap(s.document).get(element.id) ?? null
  )
  const numberingMode = useBuilderStore((s) =>
    getQuestionNumberingMode(s.document)
  )
  const surveyDefaultNumbering = useBuilderStore((s) =>
    getSurveyDefaultNumberingStyle(s.document)
  )

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

  if (element.kind === 'rich_text') {
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
          <RichTextEditor
            content={element.content}
            onChange={(content) =>
              store
                .getState()
                .updateRichTextContent(sectionId, element.id, content)
            }
            placeholder='输入说明内容…'
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
          store.getState().updateQuestion(sectionId, element.id, patch)
        }
        onConfigChange={(patch) =>
          store.getState().updateQuestionConfig(sectionId, element.id, patch)
        }
      />
    </QuestionBlock>
  )
})
