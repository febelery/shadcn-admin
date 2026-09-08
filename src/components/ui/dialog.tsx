'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />
}

function DialogTrigger({
  asChild = false,
  render,
  children,
  ...props
}: DialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <DialogPrimitive.Trigger
      data-slot='dialog-trigger'
      render={finalRender}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </DialogPrimitive.Trigger>
  )
}

function DialogPortal({
  ...props
}: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />
}

function DialogClose({
  asChild = false,
  render,
  children,
  ...props
}: DialogPrimitive.Close.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <DialogPrimitive.Close
      data-slot='dialog-close'
      render={finalRender}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </DialogPrimitive.Close>
  )
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot='dialog-overlay'
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:opacity-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        className={cn(
          'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:opacity-0',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot='dialog-close'
            className="ring-offset-background focus:ring-ring data-open:bg-accent data-open:text-muted-foreground absolute inset-e-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className='sr-only'>Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('flex flex-col gap-2 text-center sm:text-start', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  asChild = false,
  render,
  children,
  ...props
}: DialogPrimitive.Title.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      render={finalRender}
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </DialogPrimitive.Title>
  )
}

function DialogDescription({
  className,
  asChild = false,
  render,
  children,
  ...props
}: DialogPrimitive.Description.Props & { asChild?: boolean }) {
  const finalRender =
    asChild && React.isValidElement(children) ? children : render

  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      render={finalRender}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {asChild && React.isValidElement(children) ? undefined : children}
    </DialogPrimitive.Description>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
