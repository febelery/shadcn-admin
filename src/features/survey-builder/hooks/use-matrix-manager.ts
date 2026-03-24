'use client'
import { useCallback } from 'react'
import type { QuestionNode } from '../types'

export function useMatrixManager(
  node: QuestionNode,
  onConfigChange: (patch: Partial<QuestionNode['config']>) => void
) {
  const rows = (node.config.rows || []) as any[]
  const cols = (node.config.columns || []) as any[]

  const addRow = useCallback(() => {
    onConfigChange({
      rows: [
        ...rows,
        { id: crypto.randomUUID(), label: `行 ${rows.length + 1}` },
      ],
    })
  }, [rows, onConfigChange])

  const addCol = useCallback(() => {
    onConfigChange({
      columns: [
        ...cols,
        { id: crypto.randomUUID(), label: `列 ${cols.length + 1}` },
      ],
    })
  }, [cols, onConfigChange])

  const removeRow = useCallback(
    (id: string) => {
      if (rows.length > 1) {
        onConfigChange({ rows: rows.filter((r) => r.id !== id) })
      }
    },
    [rows, onConfigChange]
  )

  const removeCol = useCallback(
    (id: string) => {
      if (cols.length > 1) {
        onConfigChange({ columns: cols.filter((c) => c.id !== id) })
      }
    },
    [cols, onConfigChange]
  )

  const updateItem = useCallback(
    (type: 'rows' | 'columns', id: string, label: string) => {
      const list = type === 'rows' ? rows : cols
      onConfigChange({
        [type]: list.map((item) =>
          item.id === id ? { ...item, label } : item
        ),
      })
    },
    [rows, cols, onConfigChange]
  )

  const updateRows = useCallback(
    (newRows: any[]) => onConfigChange({ rows: newRows }),
    [onConfigChange]
  )

  const updateCols = useCallback(
    (newCols: any[]) => onConfigChange({ columns: newCols }),
    [onConfigChange]
  )

  return {
    rows,
    cols,
    addRow,
    addCol,
    removeRow,
    removeCol,
    updateItem,
    updateRows,
    updateCols,
  }
}
