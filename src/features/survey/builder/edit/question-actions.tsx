import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBuilderStoreApi } from '../store'
import type { SurveyElement } from '../types'

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
      <TooltipContent side='left' className='text-xs leading-none'>
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

function DragHandleButton({
  setActivatorNodeRef,
  attributes,
  listeners,
}: QuestionDragHandleProps) {
  return (
    <ActionTooltip label='拖动排序'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        ref={setActivatorNodeRef}
        aria-label='拖动排序'
        className='text-muted-foreground hover:bg-muted hover:text-foreground size-6 cursor-grab rounded-md active:cursor-grabbing'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className='size-3 shrink-0 stroke-2' />
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
  const store = useBuilderStoreApi()
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-2.5 right-2 z-10',
        'transition-[opacity,transform] duration-150',
        selected
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'translate-y-0.5 opacity-0 group-focus-within/question:pointer-events-auto group-focus-within/question:translate-y-0 group-focus-within/question:opacity-100 group-hover/question:pointer-events-auto group-hover/question:translate-y-0 group-hover/question:opacity-100'
      )}
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
        <DragHandleButton {...drag} />
        <ActionDivider />
        <ActionButton
          label='复制'
          onClick={() =>
            store.getState().duplicateElement(sectionId, element.id)
          }
        >
          <Copy className='size-3 shrink-0 stroke-2' />
        </ActionButton>
        <ActionDivider />
        <ActionButton
          label='删除'
          destructive
          onClick={() => store.getState().removeElement(sectionId, element.id)}
        >
          <Trash2 className='size-3 shrink-0 stroke-2' />
        </ActionButton>
      </div>
    </div>
  )
}
