import * as React from 'react'
import { flexRender, type Row } from '@tanstack/react-table'
import type { CellPosition, RowHeightValue } from '@/types/data-grid'
import type { Virtualizer } from '@tanstack/react-virtual'
import { useComposedRefs } from '@/lib/compose-refs'
import { getRowHeightValue } from '@/lib/data-grid'
import { getCommonPinningStyles } from '@/lib/data-table'
import { cn } from '@/lib/utils'

interface DataGridRowProps<TData> extends React.ComponentProps<'div'> {
  row: Row<TData>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  virtualRowIndex: number
  virtualRowStart: number
  rowMapRef: React.RefObject<Map<number, HTMLDivElement>>
  rowHeight: RowHeightValue
  focusedCell: CellPosition | null
}

export const DataGridRow = React.memo(DataGridRowImpl, (prev, next) => {
  if (prev.row.id !== next.row.id) {
    return false
  }

  if (prev.row.original !== next.row.original) {
    return false
  }

  if (prev.virtualRowIndex !== next.virtualRowIndex) {
    return false
  }

  if (prev.virtualRowStart !== next.virtualRowStart) {
    return false
  }

  if (prev.rowHeight !== next.rowHeight) {
    return false
  }

  const prevRowIndex = prev.virtualRowIndex
  const nextRowIndex = next.virtualRowIndex

  const prevHasFocus = prev.focusedCell?.rowIndex === prevRowIndex
  const nextHasFocus = next.focusedCell?.rowIndex === nextRowIndex

  if (prevHasFocus !== nextHasFocus) {
    return false
  }

  if (nextHasFocus && prevHasFocus) {
    const prevFocusedCol = prev.focusedCell?.columnId
    const nextFocusedCol = next.focusedCell?.columnId
    if (prevFocusedCol !== nextFocusedCol) {
      return false
    }
  }

  if (next.rowVirtualizer.isScrolling) {
    return true
  }

  return false
}) as typeof DataGridRowImpl

function DataGridRowImpl<TData>({
  row,
  virtualRowIndex,
  virtualRowStart,
  rowVirtualizer,
  rowMapRef,
  rowHeight,
  focusedCell,
  ref,
  className,
  ...props
}: DataGridRowProps<TData>) {
  const rowElementRef = React.useRef<HTMLDivElement | null>(null)

  const onRowChange = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof virtualRowIndex === 'undefined') return
      rowElementRef.current = node

      if (node) {
        rowVirtualizer.measureElement(node)
      }
    },
    [virtualRowIndex, rowVirtualizer]
  )

  const rowRef = useComposedRefs(ref, onRowChange)

  React.useEffect(() => {
    const node = rowElementRef.current
    if (!node) return
    const currentMap = rowMapRef.current

    currentMap?.set(virtualRowIndex, node)
    return () => {
      currentMap?.delete(virtualRowIndex)
    }
  }, [rowMapRef, virtualRowIndex])

  const isRowSelected = row.getIsSelected()

  return (
    <div
      key={row.id}
      role='row'
      aria-rowindex={virtualRowIndex + 2}
      aria-selected={isRowSelected}
      data-index={virtualRowIndex}
      data-slot='grid-row'
      ref={rowRef}
      tabIndex={-1}
      className={cn('absolute flex w-full border-b', className)}
      style={{
        height: `${getRowHeightValue(rowHeight)}px`,
        transform: `translateY(${virtualRowStart}px)`,
      }}
      {...props}
    >
      {row.getVisibleCells().map((cell, colIndex) => {
        const isCellFocused =
          focusedCell?.rowIndex === virtualRowIndex &&
          focusedCell?.columnId === cell.column.id
        const isPinned = cell.column.getIsPinned()

        return (
          <div
            key={cell.id}
            role='gridcell'
            aria-colindex={colIndex + 1}
            data-highlighted={isCellFocused ? '' : undefined}
            data-slot='grid-cell'
            tabIndex={-1}
            className={cn({
              'border-r': cell.column.id !== 'select',
              'overflow-hidden': true,
              'bg-background': isPinned,
            })}
            style={{
              ...getCommonPinningStyles({
                column: cell.column,
                zIndex: 5,
              }),
              width: `calc(var(--col-${cell.column.id}-size, ${cell.column.getSize()}) * 1px)`,
            }}
          >
            {typeof cell.column.columnDef.header === 'function' ? (
              <div
                className={cn('size-full px-3 py-1.5', {
                  'bg-primary/10': isRowSelected,
                })}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </div>
        )
      })}
    </div>
  )
}
