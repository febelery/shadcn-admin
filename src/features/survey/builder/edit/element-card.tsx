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
} from '../../core/question-numbering'
import type { SurveyElement } from '../../core/types'
import { RichTextEditor } from '../../shared/rich-text-editor'
import { useBuilderStore, useBuilderStoreApi } from '../builder-session'
import { useIsPaletteDragging } from '../shared/dnd-provider'
import {
  WorkspaceQuestionActions,
  type QuestionDragHandleProps,
} from './question-actions'
import { QuestionLogicBadges } from './question-logic-badges'
import { SurfaceQuestionBlock } from './question-surface/question-block'
import { QUESTION_NUMBER_TOGGLE_ATTR } from './question-surface/question-number-toggle'
import { scrollIntoWorkspaceView } from './workspace-scroll'

const QUESTION_REQUIRED_TOGGLE_ATTR = 'data-question-required-toggle'

type Props = {
  element: SurveyElement
  selected: boolean
}

function QuestionBlock({
  element,
  selected,
  dimmed,
  dragging,
  setNodeRef,
  style,
  drag,
  children,
}: {
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
        'group/question relative',
        'transition-[background-color,border-color,box-shadow,opacity] duration-150',
        selected
          ? 'bg-primary/[0.035] before:bg-primary before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-0.5 before:rounded-r before:content-[""]'
          : 'hover:bg-primary/[0.025]',
        dragging && 'opacity-40',
        dimmed && !dragging && 'opacity-35'
      )}
      onPointerDownCapture={(e) => {
        if (e.button !== 0) return
        const target = e.target as HTMLElement
        if (target.closest(`[${QUESTION_REQUIRED_TOGGLE_ATTR}]`)) return
        if (target.closest(`[${QUESTION_NUMBER_TOGGLE_ATTR}]`)) return
        store.getState().selectElement(element.id)
      }}
    >
      <div className='min-w-0 px-3.5 py-3 pr-11'>{children}</div>
      <WorkspaceQuestionActions
        element={element}
        selected={selected}
        drag={drag}
      />
    </article>
  )
}

export const WorkspaceElementCard = memo(function WorkspaceElementCard({
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
              store.getState().updateRichTextContent(element.id, content)
            }
            placeholder='输入说明内容…'
          />
        </div>
      </QuestionBlock>
    )
  }

  return (
    <QuestionBlock
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
        onPatch={(patch) => store.getState().updateQuestion(element.id, patch)}
        onConfigChange={(patch) =>
          store.getState().updateQuestionConfig(element.id, patch)
        }
      />
    </QuestionBlock>
  )
})
