import type { ChangeEvent, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { limitText } from '../shared/text-limits'

export type InlineEditableElement = HTMLInputElement | HTMLTextAreaElement

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  autoFocus?: boolean
  maxLength?: number
  compact?: boolean
  inputRef?: (element: InlineEditableElement | null) => void
  onKeyDown?: (event: KeyboardEvent<InlineEditableElement>) => void
  onFocus?: () => void
}

export function InlineEditable({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
  autoFocus,
  maxLength,
  compact = false,
  inputRef,
  onKeyDown,
  onFocus,
}: Props) {
  const sharedProps = {
    value,
    placeholder,
    autoFocus,
    maxLength,
    title: compact && value ? value : undefined,
    onKeyDown,
    onFocus,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = maxLength
        ? limitText(event.target.value, maxLength)
        : event.target.value
      onChange(next)
    },
  }

  if (multiline || compact) {
    return (
      <textarea
        {...sharedProps}
        ref={inputRef}
        rows={1}
        className={cn(
          'placeholder:text-muted-foreground/50 [field-sizing:content] w-full resize-none overflow-hidden border-0 bg-transparent p-0 shadow-none outline-none',
          multiline && !compact && 'min-h-[1.5em] whitespace-pre-wrap',
          compact &&
            'max-h-[1.5em] min-h-[1.25em] truncate whitespace-nowrap focus:max-h-none focus:overflow-visible focus:whitespace-normal',
          className
        )}
      />
    )
  }

  return (
    <input
      {...sharedProps}
      ref={inputRef}
      className={cn(
        'placeholder:text-muted-foreground/50 min-h-[1.25em] w-full min-w-0 border-0 bg-transparent p-0 shadow-none outline-none',
        className
      )}
    />
  )
}
