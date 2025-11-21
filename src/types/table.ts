import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'

/**
 * URL 搜索参数记录类型
 */
export type SearchRecord = Record<string, unknown>

/**
 * 导航函数类型用于更新 URL 搜索参数
 */
export type NavigateFn = (opts: {
  search:
    | true
    | SearchRecord
    | ((prev: SearchRecord) => Partial<SearchRecord> | SearchRecord)
  replace?: boolean
}) => void

/**
 * 配置 useTableUrlState hook
 */
export type UseTableUrlStateParams = {
  search: SearchRecord
  navigate: NavigateFn
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
 * 返回类型 useTableUrlState hook
 */
export type UseTableUrlStateReturn = {
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
  // 助手
  ensurePageInRange: (
    pageCount: number,
    opts?: { resetTo?: 'first' | 'last' }
  ) => void
}
