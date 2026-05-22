import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  density?: 'default' | 'compact'
  className?: string
}

/** 设计器统一引导/空态 */
export function BuilderGuidance({
  icon: Icon,
  title,
  description,
  density = 'default',
  className,
}: Props) {
  const compact = density === 'compact'

  return (
    <div className={cn(compact ? 'gap-2' : 'gap-3', className)}>
      {Icon ? (
        <Icon
          className={cn(
            'text-muted-foreground/40 mx-auto shrink-0 stroke-[1.25]',
            compact ? 'size-6' : 'size-8'
          )}
          aria-hidden
        />
      ) : null}
      <p
        className={cn(
          compact
            ? 'text-sm leading-none font-semibold tracking-tight'
            : 'text-foreground text-base font-semibold tracking-tight'
        )}
      >
        {title}
      </p>
      {description ? (
        <div className='text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed'>
          {description}
        </div>
      ) : null}
    </div>
  )
}
