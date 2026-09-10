import type React from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { MessageScroller as MessageScrollerPrimitive } from '@shadcn/react/message-scroller'
import { cn } from 'cn'
import { ArrowDown } from 'lucide-react'

export const MessageScrollerProvider = MessageScrollerPrimitive.Provider
export const MessageScrollerRoot = MessageScrollerPrimitive.Root
export const MessageScrollerViewport = MessageScrollerPrimitive.Viewport
export const MessageScrollerContent = MessageScrollerPrimitive.Content
export const MessageScrollerItem = MessageScrollerPrimitive.Item
export { useMessageScroller } from '@shadcn/react/message-scroller'

export function MessageScrollerButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button>) {
  return (
    <MessageScrollerPrimitive.Button
      className={cn(
        'bg-background/90 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute right-6 bottom-20 z-20 flex size-8 items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition-all focus-visible:ring-2 data-[active=false]:pointer-events-none data-[active=false]:opacity-0 data-[active=true]:opacity-100',
        className
      )}
      {...props}
    >
      {children ?? <ArrowDown className='size-3.5' />}
    </MessageScrollerPrimitive.Button>
  )
}

export function MessageScroller({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <MessageScrollerPrimitive.Provider autoScroll>
      <MessageScrollerPrimitive.Root className='relative flex min-h-0 flex-1 flex-col'>
        <MessageScrollerPrimitive.Viewport
          className={cn('h-full overflow-y-auto scroll-smooth', className)}
        >
          <MessageScrollerPrimitive.Content className='flex min-h-full flex-1 flex-col'>
            {children}
          </MessageScrollerPrimitive.Content>
        </MessageScrollerPrimitive.Viewport>
        <MessageScrollerButton />
      </MessageScrollerPrimitive.Root>
    </MessageScrollerPrimitive.Provider>
  )
}

export function Message({
  className,
  align = 'start',
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  return (
    <article
      className={cn(
        'flex w-full gap-3 py-2 transition-opacity duration-200',
        align === 'end' ? 'justify-end' : 'justify-start',
        className
      )}
      {...props}
    />
  )
}

export function Bubble({
  className,
  variant = 'assistant',
  children,
}: {
  className?: string
  variant?: 'assistant' | 'user' | 'muted'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'text-sm leading-relaxed',
        variant === 'user'
          ? 'bg-muted/80 text-foreground dark:bg-muted/50 max-w-[85%] rounded-2xl px-4 py-2.5 shadow-2xs sm:max-w-[75%]'
          : variant === 'muted'
            ? 'bg-muted/40 max-w-[85%] rounded-2xl border px-4 py-3'
            : 'text-foreground max-w-full space-y-3',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Attachment({
  filename,
  mediaType,
  className,
}: {
  filename?: string
  mediaType: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-card hover:bg-accent/40 group flex w-fit max-w-sm items-center gap-3 rounded-xl border p-3 text-xs shadow-2xs transition-colors',
        className
      )}
    >
      <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-semibold uppercase'>
        {mediaType.split('/')[1] ?? 'DOC'}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-foreground truncate font-medium'>
          {filename ?? '附件'}
        </p>
        <p className='text-muted-foreground text-[11px]'>{mediaType}</p>
      </div>
    </div>
  )
}

export function Marker({ children }: { children: ReactNode }) {
  return (
    <div className='text-muted-foreground flex items-center gap-3 py-4 text-xs'>
      <div className='bg-border/60 h-px flex-1' />
      <span className='text-muted-foreground/80 font-medium'>{children}</span>
      <div className='bg-border/60 h-px flex-1' />
    </div>
  )
}
