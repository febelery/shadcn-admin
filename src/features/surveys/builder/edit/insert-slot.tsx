import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useActiveDrag, INSERT_DROP } from '../shared/dnd-provider'

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
            className='border-primary bg-primary/5 text-foreground flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-xs leading-none font-medium transition-colors duration-150'
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.985 },
                  animate: { opacity: 1, scale: 1 },
                  exit: { opacity: 0, scale: 0.985 },
                  transition: {
                    duration: 0.16,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                })}
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
