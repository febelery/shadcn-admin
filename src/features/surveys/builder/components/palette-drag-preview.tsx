import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  icon: LucideIcon
  className?: string
}

/** 题型拖出预览 — 与双列卡片一致 */
export function PaletteDragPreview({ label, icon: Icon, className }: Props) {
  return (
    <div
      className={cn(
        'bg-background text-foreground pointer-events-none flex h-8 w-32 cursor-grabbing items-center gap-1.5 rounded-md border border-border px-1.5 shadow-lg',
        className
      )}
    >
      <span className='bg-muted/60 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md'>
        <Icon className='size-3.5' />
      </span>
      <span className='min-w-0 flex-1 truncate text-[11px] leading-none font-medium'>
        {label}
      </span>
    </div>
  )
}
