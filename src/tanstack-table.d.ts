import '@tanstack/react-table'
import type { CellData, RowData, TableFeatures } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    label?: string
    className?: string
    tdClassName?: string
    thClassName?: string
  }
}
