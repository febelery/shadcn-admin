import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { builderInsertPlaceholder } from '../ui'
import { INSERT_DROP } from '../dnd'
import { useBuilderDnd } from '../components/builder-dnd-provider'

type Props = {
  sectionId: string
  index: number
}

export function WorkspaceInsertSlot({ sectionId, index }: Props) {
  const { activeDrag, dropTarget } = useBuilderDnd()
  const slotId = `workspace-insert-${sectionId}-${index}`

  const isPaletteDrag = activeDrag?.kind === 'palette'
  const isActive =
    isPaletteDrag &&
    dropTarget?.sectionId === sectionId &&
    dropTarget.index === index

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { type: INSERT_DROP, sectionId, index },
    disabled: !isPaletteDrag,
  })

  const showPlaceholder = isActive || (isPaletteDrag && isOver)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex flex-col justify-center transition-all duration-200',
        isPaletteDrag ? 'min-h-4 py-0.5' : 'h-0 overflow-hidden',
        showPlaceholder && 'min-h-[56px] py-1'
      )}
      aria-hidden={!isPaletteDrag}
    >
      {showPlaceholder ? (
        <div className={builderInsertPlaceholder(true)}>
          <div className='bg-border h-1 w-full max-w-[120px] rounded-full' />
          <span>松手插入「{activeDrag?.label}」</span>
        </div>
      ) : isPaletteDrag ? (
        <div
          className={cn(
            'mx-3 h-0.5 rounded-full transition-colors',
            isOver ? 'bg-muted-foreground/40' : 'bg-transparent'
          )}
        />
      ) : null}
    </div>
  )
}
