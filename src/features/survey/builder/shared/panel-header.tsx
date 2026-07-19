import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  /** 仅收紧左右内边距，高度仍为 h-12 */
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
        'border-border/80 bg-background/80 flex min-h-12 shrink-0 items-center gap-2.5 border-b px-4 py-2.5',
        compact && 'px-3',
        className
      )}
    >
      {Icon ? <Icon className='text-primary/70 size-4 shrink-0' /> : null}
      <div className='min-w-0 flex-1'>
        <h2 className='truncate text-sm leading-none font-semibold'>{title}</h2>
        {!compact && description ? (
          <p className='text-muted-foreground mt-1 truncate text-xs leading-snug'>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
