import { useRef, useCallback } from 'react'
import type { ChoiceOption } from '../../../core/types'
import type { InlineEditableElement } from '../inline-editable'

type Options = {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
}

function focusEditor(element: InlineEditableElement) {
  element.focus()
  element.setSelectionRange(element.value.length, element.value.length)
}

/** 画布选项列表：增删改标签与编辑焦点。 */
export function useChoiceOptions({ options, onChange }: Options) {
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
      onChange(options.filter((option) => option.id !== id))
    },
    [onChange, options]
  )

  const insertOptionAfter = useCallback(
    (index: number, factory?: () => ChoiceOption) => {
      const next: ChoiceOption = factory?.() ?? {
        id: crypto.randomUUID(),
        label: '',
      }
      const merged = [...options]
      merged.splice(index + 1, 0, next)
      onChange(merged)
      focusRow(next.id)
      return next
    },
    [onChange, options, focusRow]
  )

  const insertAfterLast = useCallback(
    (factory?: () => ChoiceOption) => {
      return insertOptionAfter(options.length - 1, factory)
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
    insertAfterLast,
    focusPreviousOption,
  }
}
