import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/utils'
import { clampText } from '../label-limits'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  autoFocus?: boolean
  /** 超出后截断（输入时生效） */
  maxLength?: number
  /**
   * 紧凑格：未聚焦时单行省略，聚焦时允许换行编辑；
   * 用于矩阵表头等窄列
   */
  compact?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocus?: () => void
}

/** 画布内联文本编辑（contenteditable，无边框） */
export function InlineEditable({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
  autoFocus,
  maxLength,
  compact = false,
  onKeyDown,
  onFocus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const composing = useRef(false)
  const [focused, setFocused] = useState(false)

  const normalize = useCallback(
    (raw: string) => {
      const trimmed = raw
      return maxLength ? clampText(trimmed, maxLength) : trimmed
    },
    [maxLength]
  )

  const syncFromDom = useCallback(() => {
    if (!ref.current || composing.current) return
    const text = normalize(ref.current.textContent ?? '')
    if (ref.current.textContent !== text) {
      ref.current.textContent = text
    }
    if (text !== value) onChange(text)
  }, [onChange, normalize, value])

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const next = normalize(value)
    if ((el.textContent ?? '') !== next) {
      el.textContent = next
    }
  }, [normalize, value])

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [autoFocus])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role='textbox'
      aria-multiline={multiline || compact ? true : undefined}
      data-placeholder={placeholder}
      title={compact && !focused && value ? value : undefined}
      className={cn(
        'outline-none',
        'empty:before:pointer-events-none empty:before:text-muted-foreground/50 empty:before:content-[attr(data-placeholder)]',
        multiline && !compact && 'min-h-[1.5em] whitespace-pre-wrap wrap-break-word',
        !multiline && !compact && 'min-h-[1.25em] min-w-0 wrap-break-word',
        compact &&
          !focused &&
          'max-w-full min-w-0 truncate whitespace-nowrap',
        compact &&
          focused &&
          'max-w-full min-w-0 overflow-visible whitespace-normal break-all',
        className
      )}
      onInput={syncFromDom}
      onBlur={() => {
        setFocused(false)
        syncFromDom()
      }}
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={() => {
        composing.current = false
        syncFromDom()
      }}
      onKeyDown={onKeyDown}
      onFocus={() => {
        setFocused(true)
        onFocus?.()
      }}
    />
  )
}

export function focusInlineEditable(el: HTMLElement | null) {
  if (!el) return
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}
