import * as React from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

function Collapsible({
  asChild,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Root.Props & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Root
      data-slot='collapsible'
      render={(rootProps, state) => {
        const mergedProps = {
          ...rootProps,
          'data-state': state.open ? 'open' : 'closed',
        }
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(
            children as React.ReactElement<any>,
            mergedProps
          )
        }
        if (typeof render === 'function') {
          return render(mergedProps, state)
        }
        if (React.isValidElement(render)) {
          return React.cloneElement(render, mergedProps)
        }
        return <div {...mergedProps}>{children}</div>
      }}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  asChild,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot='collapsible-trigger'
      render={(triggerProps, state) => {
        const mergedProps = {
          ...triggerProps,
          'data-state': state.open ? 'open' : 'closed',
        }
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(
            children as React.ReactElement<any>,
            mergedProps
          )
        }
        if (typeof render === 'function') {
          return render(mergedProps, state)
        }
        if (React.isValidElement(render)) {
          return React.cloneElement(render, mergedProps)
        }
        return <button {...mergedProps}>{children}</button>
      }}
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  asChild,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Panel.Props & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot='collapsible-content'
      className={className}
      render={(panelProps, state) => {
        const mergedProps = {
          ...panelProps,
          'data-state': state.open ? 'open' : 'closed',
        }
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(
            children as React.ReactElement<any>,
            mergedProps
          )
        }
        if (typeof render === 'function') {
          return render(mergedProps, state)
        }
        if (React.isValidElement(render)) {
          return React.cloneElement(render, mergedProps)
        }
        return <div {...mergedProps}>{children}</div>
      }}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
