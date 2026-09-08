import * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@/lib/utils'

interface PopoverAnchorContextValue {
  anchor: HTMLElement | null
  setAnchor: (element: HTMLElement | null) => void
}

const PopoverAnchorContext = React.createContext<PopoverAnchorContextValue | null>(
  null
)

function Popover(props: PopoverPrimitive.Root.Props) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  return (
    <PopoverAnchorContext.Provider value={{ anchor, setAnchor }}>
      <PopoverPrimitive.Root data-slot='popover' {...props} />
    </PopoverAnchorContext.Provider>
  )
}

function PopoverTrigger({
  asChild = false,
  render,
  children,
  ...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <PopoverPrimitive.Trigger
      data-slot='popover-trigger'
      render={finalRender}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  anchor: anchorProp,
  asChild = false,
  render,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'anchor'
  > & {
    asChild?: boolean
    onOpenAutoFocus?: (event: any) => void
    onCloseAutoFocus?: (event: any) => void
    onEscapeKeyDown?: (event: any) => void
  }) {
  const ctx = React.useContext(PopoverAnchorContext)
  const anchor = anchorProp ?? ctx?.anchor ?? undefined
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className='isolate z-50'
      >
        <PopoverPrimitive.Popup
          data-slot='popover-content'
          render={finalRender}
          initialFocus={onOpenAutoFocus ? false : undefined}
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--transform-origin) rounded-md border p-4 shadow-md outline-hidden',
            className
          )}
          {...props}
        >
          {asChild && React.isValidElement(children) ? undefined : children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  asChild = false,
  render,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const ctx = React.useContext(PopoverAnchorContext)
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return useRender({
    defaultTagName: 'div',
    render: finalRender,
    props: mergeProps<'div'>(
      {
        'data-slot': 'popover-anchor',
        ref: ctx?.setAnchor,
        children: asChild ? undefined : children,
      } as React.ComponentProps<'div'>,
      props
    ),
  })
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
