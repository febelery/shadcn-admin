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
        'border-border bg-muted/60 flex h-12 shrink-0 items-center gap-2.5 border-b px-4',
        compact && 'px-3',
        className
      )}
    >
      {Icon ? <Icon className='text-foreground/60 size-4 shrink-0' /> : null}
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm leading-none font-semibold tracking-tight'>
          {title}
        </p>
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
