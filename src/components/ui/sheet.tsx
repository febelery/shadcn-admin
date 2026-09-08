import * as React from 'react'
import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />
}

function SheetTrigger({
  asChild = false,
  render,
  children,
  ...props
}: SheetPrimitive.Trigger.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <SheetPrimitive.Trigger
      data-slot='sheet-trigger'
      render={finalRender}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </SheetPrimitive.Trigger>
  )
}

function SheetClose({
  asChild = false,
  render,
  children,
  ...props
}: SheetPrimitive.Close.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <SheetPrimitive.Close
      data-slot='sheet-close'
      render={finalRender}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </SheetPrimitive.Close>
  )
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot='sheet-portal' {...props} />
}

function SheetOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot='sheet-overlay'
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/50 transition duration-300 data-closed:duration-300 data-open:duration-500 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:opacity-0',
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot='sheet-content'
        aria-describedby='sheet-content-description'
        className={cn(
          'bg-background data-open:animate-in data-closed:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-closed:duration-300 data-open:duration-500',
          side === 'right' &&
            'data-closed:slide-out-to-end data-open:slide-in-from-end inset-y-0 inset-e-0 h-full w-3/4 border-s sm:max-w-sm',
          side === 'left' &&
            'data-closed:slide-out-to-start data-open:slide-in-from-start inset-y-0 inset-s-0 h-full w-3/4 border-e sm:max-w-sm',
          side === 'top' &&
            'data-closed:slide-out-to-top data-open:slide-in-from-top inset-x-0 top-0 h-auto border-b',
          side === 'bottom' &&
            'data-closed:slide-out-to-bottom data-open:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className='ring-offset-background focus:ring-ring data-open:bg-secondary absolute inset-e-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none'>
          <XIcon className='size-4' />
          <span className='sr-only'>Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-header'
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot='sheet-description'
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
