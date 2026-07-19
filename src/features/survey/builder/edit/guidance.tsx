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
            'text-primary/55 mx-auto shrink-0 stroke-[1.5]',
            compact ? 'size-6' : 'size-8'
          )}
          aria-hidden
        />
      ) : null}
      <h3
        className={cn(
          compact
            ? 'text-sm leading-snug font-semibold'
            : 'text-foreground text-lg leading-snug font-semibold'
        )}
      >
        {title}
      </h3>
      {description ? (
        <div className='text-muted-foreground mx-auto max-w-sm text-[13px] leading-relaxed'>
          {description}
        </div>
      ) : null}
    </div>
  )
}
