import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  /** compact：更高信息密度，省略副标题行 */
  density?: 'default' | 'compact'
  className?: string
}

/** 三栏工作区统一顶栏（高度、边框、对齐一致） */
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
        'bg-background flex h-11 shrink-0 items-center gap-2 border-b border-border px-4',
        compact && 'h-9 min-h-9 px-2.5',
        className
      )}
    >
      {Icon ? <Icon className='text-muted-foreground size-4 shrink-0' /> : null}
      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            'truncate font-medium leading-none',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {title}
        </p>
        {!compact && description ? (
          <p className='text-muted-foreground mt-0.5 truncate text-xs leading-none'>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
