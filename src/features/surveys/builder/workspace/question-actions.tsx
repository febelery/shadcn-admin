import { Copy, GripVertical, Trash2 } from 'lucide-react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SurveyElement } from '../../core/types'
import { useBuilderStore } from '../store'
import { builderQuestionActions } from '../ui'

const actionIcon = 'size-3 shrink-0 stroke-[2]'

export type QuestionDragHandleProps = {
  setActivatorNodeRef: (node: HTMLElement | null) => void
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}

function ActionTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side='left' className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function ActionButton({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <ActionTooltip label={label}>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={label}
        className={cn(
          'size-6 rounded-md',
          destructive
            ? 'text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </ActionTooltip>
  )
}

function ActionDivider() {
  return <Separator className='bg-border/50 mx-0.5 w-[calc(100%-0.25rem)]' />
}

function DragHandleButton({ drag }: { drag: QuestionDragHandleProps }) {
  return (
    <ActionTooltip label='拖动排序'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        ref={drag.setActivatorNodeRef}
        aria-label='拖动排序'
        className='text-muted-foreground hover:bg-muted hover:text-foreground size-6 cursor-grab rounded-md active:cursor-grabbing'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...drag.attributes}
        {...drag.listeners}
      >
        <GripVertical className={actionIcon} />
      </Button>
    </ActionTooltip>
  )
}

type Props = {
  sectionId: string
  element: SurveyElement
  selected: boolean
  drag: QuestionDragHandleProps
}

/** 题目块右侧：拖拽 + 复制 + 删除 */
export function WorkspaceQuestionActions({
  sectionId,
  element,
  selected,
  drag,
}: Props) {
  const duplicateElement = useBuilderStore((s) => s.duplicateElement)
  const removeElement = useBuilderStore((s) => s.removeElement)

  return (
    <div
      className={builderQuestionActions(selected)}
      data-surface-chrome
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          'flex flex-col items-stretch rounded-md p-px',
          'border-border/50 bg-background/95 border shadow-sm backdrop-blur-sm'
        )}
        role='toolbar'
        aria-label='题目操作'
      >
        <DragHandleButton drag={drag} />
        <ActionDivider />
        <ActionButton
          label='复制'
          onClick={() => duplicateElement(sectionId, element.id)}
        >
          <Copy className={actionIcon} />
        </ActionButton>
        <ActionDivider />
        <ActionButton
          label='删除'
          destructive
          onClick={() => removeElement(sectionId, element.id)}
        >
          <Trash2 className={actionIcon} />
        </ActionButton>
      </div>
    </div>
  )
}
