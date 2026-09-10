import * as React from 'react'
import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card'
import { cn } from 'cn'

interface HoverCardContextValue {
  delay?: number
  closeDelay?: number
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null)

function HoverCard({
  delay,
  openDelay,
  closeDelay,
  children,
  ...props
}: PreviewCardPrimitive.Root.Props & {
  openDelay?: number
  delay?: number
  closeDelay?: number
}) {
  const effectiveDelay = openDelay ?? delay
  return (
    <HoverCardContext.Provider value={{ delay: effectiveDelay, closeDelay }}>
      <PreviewCardPrimitive.Root data-slot='hover-card' {...props}>
        {children}
      </PreviewCardPrimitive.Root>
    </HoverCardContext.Provider>
  )
}

function HoverCardTrigger({
  delay,
  closeDelay,
  ...props
}: PreviewCardPrimitive.Trigger.Props) {
  const ctx = React.useContext(HoverCardContext)

  return (
    <PreviewCardPrimitive.Trigger
      data-slot='hover-card-trigger'
      delay={delay ?? ctx?.delay}
      closeDelay={closeDelay ?? ctx?.closeDelay}
      {...props}
    />
  )
}

function HoverCardContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  collisionPadding,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot='hover-card-portal'>
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className='isolate z-50'
      >
        <PreviewCardPrimitive.Popup
          data-slot='hover-card-content'
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--transform-origin) rounded-md border p-4 shadow-md outline-hidden',
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
