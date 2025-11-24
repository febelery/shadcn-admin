import type { Column } from '@tanstack/react-table'

/**
 * 获取列的固定（pinning）样式
 * 用于支持列的左右固定功能
 */
export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData>
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    column.getIsPinned() === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    column.getIsPinned() === 'right' && column.getIsFirstColumn('right')

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : undefined,
    zIndex: isPinned ? 1 : undefined,
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px rgba(0, 0, 0, 0.1) inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px rgba(0, 0, 0, 0.1) inset'
        : undefined,
  }
}
