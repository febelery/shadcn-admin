'use client'
import { useCallback } from 'react'
import { useBuilderStore } from '../store'
import type { ChoiceOption } from '../types'

export function useOptionsManager(nodeId: string, options: ChoiceOption[]) {
  const { updateNodeConfig } = useBuilderStore()

  const save = useCallback(
    (newOpts: ChoiceOption[]) => {
      updateNodeConfig(nodeId, {
        options: newOpts.map((o, i) => ({ ...o, order: i })),
      })
    },
    [nodeId, updateNodeConfig]
  )

  const addOption = useCallback(
    (index: number) => {
      const newId = crypto.randomUUID()
      const newOpts = [
        ...options.slice(0, index + 1),
        {
          id: newId,
          label: '',
          value: `opt_${newId.slice(0, 8)}`,
          order: index + 1,
        },
        ...options.slice(index + 1),
      ]
      save(newOpts)

      // Auto-focus new option
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(
          `[data-opt-id="${newId}"]`
        )
        el?.focus()
      }, 30)
    },
    [options, save]
  )

  const removeOption = useCallback(
    (id: string) => {
      if (options.length > 1) {
        save(options.filter((o) => o.id !== id))
      }
    },
    [options, save]
  )

  const updateLabel = useCallback(
    (id: string, label: string) => {
      save(
        options.map((o) =>
          o.id === id
            ? {
                ...o,
                label,
                value: label.toLowerCase().replace(/\s+/g, '_') || o.value,
              }
            : o
        )
      )
    },
    [options, save]
  )

  const updateImage = useCallback(
    (id: string, image: string) => {
      save(options.map((o) => (o.id === id ? { ...o, image } : o)))
    },
    [options, save]
  )

  return {
    save,
    addOption,
    removeOption,
    updateLabel,
    updateImage,
  }
}
