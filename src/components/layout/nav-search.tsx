'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { SidebarHeader, useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function NavSearch({ className }: { className?: string }) {
  const { setOpen } = useSearch()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarHeader className={cn(className)}>
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className='hover:bg-sidebar-accent flex size-7 items-center justify-center rounded-md transition-[width,height,padding] duration-200 ease-linear'
                onClick={() => setOpen(true)}
                aria-label='搜索'
              >
                <Search className='h-4 w-4' />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side='right'
              align='center'
              hidden={!isCollapsed || isMobile}
            >
              搜索
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div
          className={cn(
            'border-border hover:bg-sidebar-accent flex h-8 w-full cursor-pointer items-center justify-between rounded-md border px-3 transition-[width,height,padding] duration-200 ease-linear'
          )}
          onClick={() => setOpen(true)}
        >
          <div className='flex min-w-0 flex-1 items-center gap-3 overflow-hidden'>
            <Search className='text-muted-foreground h-4 w-4 shrink-0' />
            <span className='text-muted-foreground text-sm font-normal whitespace-nowrap'>
              搜索
            </span>
          </div>
          <div className='border-border bg-background flex shrink-0 items-center justify-center rounded-md border px-2 py-0.5'>
            <kbd className='text-muted-foreground inline-flex font-[inherit] text-xs font-medium'>
              <span className='opacity-70'>⌘K</span>
            </kbd>
          </div>
        </div>
      )}
    </SidebarHeader>
  )
}
