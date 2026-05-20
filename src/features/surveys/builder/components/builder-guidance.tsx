import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  builderTypeCaption,
  builderTypeHeadline,
} from '../ui'

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
            ? builderTypeHeadline
            : 'text-base font-semibold tracking-tight text-foreground'
        )}
      >
        {title}
      </p>
      {description ? (
        <div className={cn(builderTypeCaption, 'mx-auto max-w-sm')}>
          {description}
        </div>
      ) : null}
    </div>
  )
}
