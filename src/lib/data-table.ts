import type { DataGridColumn } from '@/lib/table'
import type { RowData } from '@tanstack/react-table'

/**
 * 获取列的固定（pinning）样式
 * 用于支持列的左右固定功能（专用于 DataGrid 场景）
 */
export function getCommonPinningStyles<TData extends RowData = RowData>({
  column,
  zIndex,
}: {
  column: DataGridColumn<TData>
  zIndex?: number
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastStartPinnedColumn =
    isPinned === 'start' && column.getIsLastColumn('start')
  const isFirstEndPinnedColumn =
    isPinned === 'end' && column.getIsFirstColumn('end')

  return {
    left: isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
    right: isPinned === 'end' ? `${column.getAfter('end')}px` : undefined,
    position: isPinned ? 'sticky' : undefined,
    zIndex: isPinned ? (zIndex ?? 1) : undefined,
    boxShadow: isLastStartPinnedColumn
      ? '-4px 0 4px -4px rgba(0, 0, 0, 0.1) inset'
      : isFirstEndPinnedColumn
        ? '4px 0 4px -4px rgba(0, 0, 0, 0.1) inset'
        : undefined,
  }
}
