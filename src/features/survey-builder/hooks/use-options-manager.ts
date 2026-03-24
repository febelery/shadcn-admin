'use client'
import { useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { useFocus } from '@/hooks/use-focus'
import type { ChoiceOption, QuestionNode } from '../types'

export function useOptionsManager(
  node: QuestionNode,
  onConfigChange: (patch: Partial<QuestionNode['config']>) => void,
  options: { autoValue?: boolean } = { autoValue: true }
) {
  const rawOptions = (node.config.options as ChoiceOption[]) ?? []
  const [focusId, requestFocus] = useFocus()

  const save = useCallback(
    (newOpts: ChoiceOption[]) => {
      onConfigChange({
        options: newOpts.map((o, i) => ({ ...o, order: i })),
      })
    },
    [onConfigChange]
  )

  const addOption = useCallback(
    (index?: number) => {
      const newId = crypto.randomUUID()
      const insertionIndex =
        typeof index === 'number' ? index + 1 : rawOptions.length

      const newItem: ChoiceOption = {
        id: newId,
        label: '',
        value: `opt_${newId.slice(0, 8)}`,
        order: insertionIndex,
      }

      const newOpts = [
        ...rawOptions.slice(0, insertionIndex),
        newItem,
        ...rawOptions.slice(insertionIndex),
      ]
      save(newOpts)
      requestFocus(newId)
    },
    [rawOptions, save, requestFocus]
  )

  const removeOption = useCallback(
    (id: string) => {
      if (rawOptions.length > 1) {
        save(rawOptions.filter((o) => o.id !== id))
      }
    },
    [rawOptions, save]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<ChoiceOption>) => {
      save(rawOptions.map((o) => (o.id === id ? { ...o, ...patch } : o)))
    },
    [rawOptions, save]
  )

  const updateLabel = useCallback(
    (id: string, label: string) => {
      const patch: Partial<ChoiceOption> = { label }
      if (options.autoValue) {
        patch.value =
          label.toLowerCase().replace(/\s+/g, '_') || `opt_${id.slice(0, 8)}`
      }
      updateItem(id, patch)
    },
    [updateItem, options.autoValue]
  )

  const handleDragEnd = useCallback(
    ({ active, over }: { active: any; over: any }) => {
      if (!over || active.id === over.id) return
      const oldIdx = rawOptions.findIndex((o) => o.id === active.id)
      const newIdx = rawOptions.findIndex((o) => o.id === over.id)
      save(arrayMove(rawOptions, oldIdx, newIdx))
    },
    [rawOptions, save]
  )

  return {
    options: rawOptions,
    focusId,
    addOption,
    removeOption,
    updateItem,
    updateLabel,
    handleDragEnd,
    requestFocus,
  }
}
