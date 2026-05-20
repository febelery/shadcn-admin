import { useRef, useCallback } from 'react'
import {
  DEFAULT_OTHER_LABEL,
  partitionChoiceOptions,
  syncOtherChoiceOption,
} from '../../core/choice-other-option'
import { createQuestionId } from '../../core/schema-defaults'
import type { ChoiceOption } from '../../core/types'
import { focusInlineEditable } from './inline-editable'

type Options = {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
  allowOther?: boolean
  otherLabel?: string
}

/** 画布选项列表：增删改标签与「其他」同步 */
export function useChoiceOptions({
  options,
  onChange,
  allowOther = false,
  otherLabel = DEFAULT_OTHER_LABEL,
}: Options) {
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  const optionsRef = useRef(options)
  optionsRef.current = options

  const setRowRef = useCallback((id: string, el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }, [])

  const focusRow = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const row = rowRefs.current.get(id)
      focusInlineEditable(
        row?.querySelector('[contenteditable]') as HTMLElement | null
      )
    })
  }, [])

  const updateOptionLabel = useCallback(
    (id: string, label: string) => {
      onChange(
        optionsRef.current.map((o) =>
          o.id === id ? { ...o, label } : o
        )
      )
    },
    [onChange]
  )

  const removeOption = useCallback(
    (id: string) => {
      const current = optionsRef.current
      if (current.length <= 1) return
      const next = current.filter((o) => o.id !== id)
      onChange(
        syncOtherChoiceOption(
          partitionChoiceOptions(next).regular,
          allowOther,
          otherLabel
        )
      )
    },
    [onChange, allowOther, otherLabel]
  )

  const insertOptionAfter = useCallback(
    (index: number, factory?: () => ChoiceOption) => {
      const current = optionsRef.current
      const { regular } = partitionChoiceOptions(current)
      const next: ChoiceOption = factory?.() ?? {
        id: createQuestionId(),
        label: '',
      }
      const merged = [...regular]
      merged.splice(index + 1, 0, next)
      onChange(syncOtherChoiceOption(merged, allowOther, otherLabel))
      focusRow(next.id)
      return next
    },
    [onChange, allowOther, otherLabel, focusRow]
  )

  const insertAfterLastRegular = useCallback(
    (factory?: () => ChoiceOption) => {
      const { regular } = partitionChoiceOptions(optionsRef.current)
      return insertOptionAfter(regular.length - 1, factory)
    },
    [insertOptionAfter]
  )

  const focusPreviousOption = useCallback(
    (index: number) => {
      const prev = optionsRef.current[index - 1]
      if (prev) focusRow(prev.id)
    },
    [focusRow]
  )

  return {
    rowRefs,
    setRowRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLastRegular,
    focusPreviousOption,
    partition: () => partitionChoiceOptions(optionsRef.current),
  }
}
