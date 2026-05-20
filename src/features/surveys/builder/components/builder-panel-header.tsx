import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  builderPanelHeaderBar,
  builderTypeHeadline,
  builderTypeSubhead,
} from '../ui'

type Props = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  density?: 'default' | 'compact'
  className?: string
}

export function BuilderPanelHeader({
  title,
  description,
  icon: Icon,
  action,
  density = 'default',
  className,
}: Props) {
  const compact = density === 'compact'

  return (
    <div
      className={cn(
        builderPanelHeaderBar,
        compact && 'h-10 min-h-10 px-3',
        className
      )}
    >
      {Icon ? (
        <Icon className='text-foreground/60 size-4 shrink-0' />
      ) : null}
      <div className='min-w-0 flex-1'>
        <p className={cn(builderTypeHeadline, 'truncate')}>{title}</p>
        {!compact && description ? (
          <p className={cn(builderTypeSubhead, 'mt-1 truncate')}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
