import * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const markerVariants = cva(
  'flex items-center gap-2 text-muted-foreground text-xs',
  {
    variants: {
      variant: {
        default: 'py-2',
        border: 'border-b py-3',
        separator:
          'before:bg-border after:bg-border py-3 before:h-px before:flex-1 after:h-px after:flex-1',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Marker({
  className,
  variant = 'default',
  render,
  children,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps(
      { className: cn(markerVariants({ variant, className })), children },
      props
    ),
  })
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center [&_svg]:size-3.5', className)}
      {...props}
    />
  )
}

function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('min-w-0', className)} {...props} />
}

export { Marker, MarkerContent, MarkerIcon, markerVariants }
