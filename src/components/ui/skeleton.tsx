import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

function Skeleton({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      data-slot='skeleton'
      className={cn(
        'bg-muted relative overflow-hidden rounded-md',
        !shimmer && 'bg-accent animate-pulse',
        className
      )}
      {...props}
    >
      {shimmer && (
        <span
          className='animate-shimmer pointer-events-none absolute inset-0 -translate-x-full'
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--foreground) 6%, transparent) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  )
}

export { Skeleton }
export type { SkeletonProps }
