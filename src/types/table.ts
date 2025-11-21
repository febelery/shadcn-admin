import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'

/**
 * API 参数记录类型
 */
export type ApiParams = Record<string, unknown>

/**
 * useTableState hook 的配置选项
 */
export type TableStateOptions = {
  pagination?: {
    pageKey?: string
    pageSizeKey?: string
    defaultPage?: number
    defaultPageSize?: number
  }
  globalFilter?: {
    enabled?: boolean
    key?: string
    trim?: boolean
  }
  sorting?: {
    enabled?: boolean
    sortByKey?: string
    sortOrderKey?: string
  }
  columnFilters?: Array<
    | {
        columnId: string
        searchKey: string
        type?: 'string'
        // 可选的转换器用于自定义类型
        serialize?: (value: unknown) => unknown
        deserialize?: (value: unknown) => unknown
      }
    | {
        columnId: string
        searchKey: string
        type: 'array'
        serialize?: (value: unknown) => unknown
        deserialize?: (value: unknown) => unknown
      }
  >
}

/**
 * useTableState hook 返回的表格状态
 */
export type TableState = {
  // 全局过滤器
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  // 列过滤器
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  // 分页
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  // 排序
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  // 生成 API 参数
  getApiParams: () => ApiParams
  // 助手：确保页码在有效范围内
  ensurePageInRange: (
    pageCount: number,
    opts?: { resetTo?: 'first' | 'last' }
  ) => void
}
