import { useRef, useCallback } from 'react'
import {
  DEFAULT_OTHER_LABEL,
  partitionChoiceOptions,
  setOtherChoiceOptionEnabled,
} from '@/features/survey/core/choice-other-option'
import { createQuestionId } from '@/features/survey/core/schema-defaults'
import type { ChoiceOption } from '../../types'
import type { InlineEditableElement } from '../inline-editable'

type Options = {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}

function focusEditor(element: InlineEditableElement) {
  element.focus()
  element.setSelectionRange(element.value.length, element.value.length)
}

/** 画布选项列表：增删改标签与「其他」同步 */
export function useChoiceOptions({ options, onChange }: Options) {
  const otherOption = partitionChoiceOptions(options).other
  const otherEnabled = otherOption !== undefined
  const otherLabel = otherOption?.label ?? DEFAULT_OTHER_LABEL

  const editorRefs = useRef<Map<string, InlineEditableElement>>(new Map())
  const pendingFocusId = useRef<string | null>(null)

  const setEditorRef = useCallback(
    (id: string, el: InlineEditableElement | null) => {
      if (!el) {
        editorRefs.current.delete(id)
        return
      }
      editorRefs.current.set(id, el)
      if (pendingFocusId.current === id) {
        pendingFocusId.current = null
        focusEditor(el)
      }
    },
    []
  )

  const focusRow = useCallback((id: string) => {
    const editor = editorRefs.current.get(id)
    if (editor) {
      focusEditor(editor)
      return
    }
    pendingFocusId.current = id
  }, [])

  const updateOptionLabel = useCallback(
    (id: string, label: string) => {
      const next = options.map((option) =>
        option.id === id ? { ...option, label } : option
      )
      onChange(next)
    },
    [onChange, options]
  )

  const removeOption = useCallback(
    (id: string) => {
      if (options.length <= 1) return
      const next = options.filter((o) => o.id !== id)
      onChange(
        setOtherChoiceOptionEnabled(
          partitionChoiceOptions(next).regular,
          otherEnabled,
          otherLabel
        )
      )
    },
    [onChange, options, otherEnabled, otherLabel]
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
      onChange(setOtherChoiceOptionEnabled(merged, otherEnabled, otherLabel))
      focusRow(next.id)
      return next
    },
    [onChange, options, otherEnabled, otherLabel, focusRow]
  )

  const insertAfterLastRegular = useCallback(
    (factory?: () => ChoiceOption) => {
      const { regular } = partitionChoiceOptions(options)
      return insertOptionAfter(regular.length - 1, factory)
    },
    [insertOptionAfter, options]
  )

  const focusPreviousOption = useCallback(
    (index: number) => {
      const prev = options[index - 1]
      if (prev) focusRow(prev.id)
    },
    [focusRow, options]
  )

  return {
    setEditorRef,
    updateOptionLabel,
    removeOption,
    insertOptionAfter,
    insertAfterLastRegular,
    focusPreviousOption,
    partition: () => partitionChoiceOptions(options),
  }
}
