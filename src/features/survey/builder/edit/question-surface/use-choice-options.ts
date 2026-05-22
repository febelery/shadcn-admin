import { useRef, useCallback } from 'react'
import { useBuilderStatic } from '../../context'
import type { ChoiceOption } from '../../types'
import { focusInlineEditable } from '../inline-editable'

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
  otherLabel,
}: Options) {
  const {
    DEFAULT_OTHER_LABEL,
    partitionChoiceOptions,
    syncOtherChoiceOption,
    createQuestionId,
  } = useBuilderStatic()

  const resolvedOtherLabel = otherLabel ?? DEFAULT_OTHER_LABEL

  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map())

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
      onChange(options.map((o) => (o.id === id ? { ...o, label } : o)))
    },
    [onChange, options]
  )

  const removeOption = useCallback(
    (id: string) => {
      if (options.length <= 1) return
      const next = options.filter((o) => o.id !== id)
      onChange(
        syncOtherChoiceOption(
          partitionChoiceOptions(next).regular,
          allowOther,
          resolvedOtherLabel
        )
      )
    },
    [
      onChange,
      options,
      allowOther,
      resolvedOtherLabel,
      syncOtherChoiceOption,
      partitionChoiceOptions,
    ]
  )

  const insertOptionAfter = useCallback(
    (index: number, factory?: () => ChoiceOption) => {
      const { regular } = partitionChoiceOptions(options)
      const next: ChoiceOption = factory?.() ?? {
        id: createQuestionId(),
        label: '',
      }
      const merged = [...regular]
      merged.splice(index + 1, 0, next)
      onChange(syncOtherChoiceOption(merged, allowOther, resolvedOtherLabel))
      focusRow(next.id)
      return next
    },
    [
      onChange,
      options,
      allowOther,
      resolvedOtherLabel,
      focusRow,
      createQuestionId,
      syncOtherChoiceOption,
      partitionChoiceOptions,
    ]
  )

  const insertAfterLastRegular = useCallback(
    (factory?: () => ChoiceOption) => {
      const { regular } = partitionChoiceOptions(options)
      return insertOptionAfter(regular.length - 1, factory)
    },
    [insertOptionAfter, options, partitionChoiceOptions]
  )

  const focusPreviousOption = useCallback(
    (index: number) => {
      const prev = options[index - 1]
      if (prev) focusRow(prev.id)
    },
    [focusRow, options]
  )

  return {
    rowRefs,
    setRowRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLastRegular,
    focusPreviousOption,
    partition: () => partitionChoiceOptions(options),
  }
}
