import { useDraggable } from '@dnd-kit/core'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import type { QuestionType } from '../../core/types'
import {
  getQuestionTypeHint,
  hasQuestionTypePreview,
  type PaletteTypeId,
} from '../../shared/question-type-hints'
import { QuestionTypePreview } from '../../shared/question-type-preview'
import { PALETTE_DRAG } from '../dnd'

export type PaletteRowItem = {
  type: PaletteTypeId
  label: string
  icon: LucideIcon
  category: string
}

function paletteData(item: PaletteRowItem) {
  const isLayout = item.type === 'divider' || item.type === 'html_block'
  return {
    type: PALETTE_DRAG,
    questionType: isLayout ? undefined : (item.type as QuestionType),
    layoutType: isLayout ? item.type : undefined,
  } as const
}

const iconBoxClass =
  'bg-muted/60 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md'

type Props = {
  item: PaletteRowItem
  disabled?: boolean
  onAdd: () => void
}

/** 题型库双列卡片 — 悬停左侧题型图标显示说明 */
export function PaletteItemRow({ item, disabled, onAdd }: Props) {
  const isLayout = item.type === 'divider' || item.type === 'html_block'
  const id = `palette-${isLayout ? 'l' : 'q'}-${item.type}`
  const Icon = item.icon

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: paletteData(item),
    disabled,
  })

  const style = isDragging ? { opacity: 0 } : undefined
  const showHelp = !isDragging && !disabled

  const typeIcon = (
    <span className={iconBoxClass}>
      <Icon className='size-3.5' />
    </span>
  )

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      ref={setNodeRef}
      style={style}
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        'group h-8 w-full justify-start gap-1.5 px-1.5 font-normal',
        'hover:bg-muted/50 hover:text-foreground'
      )}
      {...listeners}
      {...attributes}
    >
      {showHelp ? (
        <HoverCard openDelay={200} closeDelay={80}>
          <HoverCardTrigger asChild>
            <span
              className={cn(iconBoxClass, 'cursor-help')}
              aria-label={`${item.label} 说明`}
            >
              <Icon className='size-3.5' />
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            side='bottom'
            align='start'
            sideOffset={6}
            collisionPadding={8}
            className={cn(hasQuestionTypePreview(item.type) ? 'w-80' : 'w-72')}
          >
            <PaletteItemHelpContent label={item.label} type={item.type} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        typeIcon
      )}
      <span className='text-muted-foreground group-hover:text-foreground min-w-0 flex-1 truncate text-left text-[11px] leading-none'>
        {item.label}
      </span>
    </Button>
  )
}

function PaletteItemHelpContent({
  label,
  type,
}: {
  label: string
  type: PaletteTypeId
}) {
  const hint = getQuestionTypeHint(type)
  const showPreview = hasQuestionTypePreview(type)

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <p className='text-sm leading-none font-medium'>{label}</p>
        <p className='text-muted-foreground text-sm leading-relaxed'>{hint}</p>
      </div>
      {showPreview ? <QuestionTypePreview type={type} /> : null}
    </div>
  )
}
