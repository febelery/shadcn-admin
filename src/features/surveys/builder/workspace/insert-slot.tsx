import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { builderInsertPlaceholder } from '../ui'
import { INSERT_DROP } from '../dnd'
import { useActiveDrag } from '../components/builder-dnd-provider'
import { surveyMotionReveal } from '../motion'

type Props = {
  sectionId: string
  index: number
}

export const WorkspaceInsertSlot = memo(function WorkspaceInsertSlot({
  sectionId,
  index,
}: Props) {
  const reducedMotion = useReducedMotion()
  const activeDrag = useActiveDrag()
  const isPaletteDrag = activeDrag?.kind === 'palette'

  const { setNodeRef, isOver } = useDroppable({
    id: `workspace-insert-${sectionId}-${index}`,
    data: { type: INSERT_DROP, sectionId, index },
    disabled: !isPaletteDrag,
  })

  const showPlaceholder = isPaletteDrag && isOver

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex flex-col justify-center transition-[min-height,padding] duration-200 ease-out',
        isPaletteDrag ? 'min-h-4 py-0.5' : 'h-0 overflow-hidden',
        showPlaceholder && 'min-h-[56px] py-1'
      )}
      aria-hidden={!isPaletteDrag}
    >
      <AnimatePresence mode='wait' initial={false}>
        {showPlaceholder ? (
          <motion.div
            key='placeholder'
            className={builderInsertPlaceholder(true)}
            {...(reducedMotion ? {} : surveyMotionReveal)}
          >
            <div className='bg-border h-1 w-full max-w-[120px] rounded-full' />
            <span>松手插入「{activeDrag?.label}」</span>
          </motion.div>
        ) : isPaletteDrag ? (
          <div
            key='guide'
            className={cn(
              'mx-3 h-0.5 rounded-full transition-colors duration-150',
              isOver ? 'bg-muted-foreground/40' : 'bg-transparent'
            )}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
})
