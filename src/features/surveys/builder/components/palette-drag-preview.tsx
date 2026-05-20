import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  builderPaletteIcon,
  builderTypeMicro,
} from '../ui'
import { surveyMotionLift } from '../motion'

type Props = {
  label: string
  icon: LucideIcon
  className?: string
}

export function PaletteDragPreview({ label, icon: Icon, className }: Props) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(
        'bg-background text-foreground pointer-events-none flex h-9 w-36 cursor-grabbing items-center gap-2 rounded-md border border-border px-2 shadow-lg',
        className
      )}
      {...(reducedMotion ? {} : surveyMotionLift)}
    >
      <span className={builderPaletteIcon}>
        <Icon className='size-3.5' />
      </span>
      <span className={cn(builderTypeMicro, 'min-w-0 flex-1 truncate font-medium')}>
        {label}
      </span>
    </motion.div>
  )
}
