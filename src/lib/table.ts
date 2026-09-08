import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column as TanstackColumn,
  type ColumnDef as TanstackColumnDef,
  type ColumnFilter,
  type ColumnFiltersState,
  type ColumnSort,
  type ColumnVisibilityState,
  type FilterFn as TanstackFilterFn,
  type Header as TanstackHeader,
  type OnChangeFn,
  type PaginationState,
  type ReactTable,
  type Row as TanstackRow,
  type RowData,
  type RowSelectionState,
  type SortDirection,
  type SortingState,
  type TableOptions as TanstackTableOptions,
  type Updater,
} from '@tanstack/react-table'
import type { DataGridColumnMeta, DataGridTableMeta } from '@/types/data-grid'

/**
 * 1. 标准业务表格特性集 (Standard Table Feature Set)
 * 面向常规管理列表（如 UserTable, TaskTable, SurveyTable）
 * 包含：列过滤、排序、分页、显示隐藏、行选择及其对应的数据模型与按需注册的函数
 */
export const standardTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equals: filterFn_equals,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
})

export type StandardTableFeatures = typeof standardTableFeatures

/**
 * 2. 复杂数据网格特性集 (DataGrid Table Feature Set)
 * 面向富交互数据网格（如 ProductPage, SurveyRecordPage, DataGrid）
 * 在标准能力基础上组合：列固定(Pinning)、列宽尺寸(Sizing)、列交互调整(Resizing)、列重排(Ordering)
 * 并在特性层注入专属的 columnMeta 与 tableMeta，与普通表格清洁隔离
 */
export const dataGridTableFeatures = tableFeatures({
  ...standardTableFeatures,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnMeta: {} as DataGridColumnMeta,
  tableMeta: {} as DataGridTableMeta,
})

export type DataGridTableFeatures = typeof dataGridTableFeatures

/* -------------------------------------------------------------------------- */
/*                                业务层强类型别名                              */
/* -------------------------------------------------------------------------- */

// 标准管理表格类型别名（绑定 StandardTableFeatures）
export type Table<TData = any> = ReactTable<
  StandardTableFeatures,
  TData extends RowData ? TData : any
>

export type Column<TData = any, TValue = unknown> = TanstackColumn<
  StandardTableFeatures,
  TData extends RowData ? TData : any,
  TValue
>

export type Row<TData = any> = TanstackRow<
  StandardTableFeatures,
  TData extends RowData ? TData : any
>

export type ColumnDef<TData = any, TValue = unknown> = TanstackColumnDef<
  StandardTableFeatures,
  TData extends RowData ? TData : any,
  TValue
>


// 复杂数据网格专用类型别名（绑定 DataGridTableFeatures，承载 Pinning / Sizing / Resizing 等专属能力）
export type DataGridTable<TData = any> = ReactTable<
  DataGridTableFeatures,
  TData extends RowData ? TData : any
>

export type DataGridColumn<TData = any, TValue = unknown> = TanstackColumn<
  DataGridTableFeatures,
  TData extends RowData ? TData : any,
  TValue
>

export type DataGridColumnDef<TData = any, TValue = unknown> =
  TanstackColumnDef<
    DataGridTableFeatures,
    TData extends RowData ? TData : any,
    TValue
  >

export type DataGridRow<TData = any> = TanstackRow<
  DataGridTableFeatures,
  TData extends RowData ? TData : any
>

export type DataGridHeader<TData = any, TValue = unknown> = TanstackHeader<
  DataGridTableFeatures,
  TData extends RowData ? TData : any,
  TValue
>

export type DataGridTableOptions<TData = any> = TanstackTableOptions<
  DataGridTableFeatures,
  TData extends RowData ? TData : any
>

export type DataGridFilterFn<TData = any> = TanstackFilterFn<
  DataGridTableFeatures,
  TData extends RowData ? TData : any
>

export {
  flexRender,
  type ColumnSort,
  type SortDirection,
  type ColumnVisibilityState,
  type RowSelectionState,
  type SortingState,
  type PaginationState,
  type ColumnFilter,
  type ColumnFiltersState,
  type Updater,
  type OnChangeFn,
}
