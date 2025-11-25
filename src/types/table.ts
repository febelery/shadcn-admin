import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import type { FilterConfig } from '@/components/filter-menu'

/**
 * API 查询参数
 */
export type QueryParams = Record<string, unknown>

/**
 * useTableState 配置选项
 */
export interface TableStateOptions {
  /**
   * 分页配置
   */
  pagination?: {
    /**
     * 页码参数名，默认为 'page'
     */
    pageKey?: string
    /**
     * 每页数量参数名，默认为 'pageSize'
     */
    pageSizeKey?: string
    /**
     * 默认页码，默认为 1
     */
    defaultPage?: number
    /**
     * 默认每页数量，默认为 10
     */
    defaultPageSize?: number
  }
  /**
   * 排序配置
   */
  sorting?: {
    /**
     * 是否启用排序，默认为 true
     */
    enabled?: boolean
    /**
     * 排序字段参数名，默认为 'sortBy'
     */
    sortByKey?: string
    /**
     * 排序方向参数名，默认为 'sortOrder'
     */
    sortOrderKey?: string
  }
  /**
   * 筛选器配置
   * 定义哪些列可以筛选
   * columnId 会直接作为 API 参数名使用
   */
  filters?: FilterConfig[]
}

/**
 * 表格状态
 */
export interface TableState {
  /**
   * 列筛选条件
   */
  columnFilters: ColumnFiltersState
  /**
   * 列筛选条件变更回调
   */
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  /**
   * 分页状态
   */
  pagination: PaginationState
  /**
   * 分页变更回调
   */
  onPaginationChange: OnChangeFn<PaginationState>
  /**
   * 排序状态
   */
  sorting?: SortingState
  /**
   * 排序变更回调
   */
  onSortingChange?: OnChangeFn<SortingState>
  /**
   * 生成查询参数
   * 自动将筛选、分页、排序条件转换为API查询参数
   */
  getQueryParams: () => QueryParams
  /**
   * 确保页码在有效范围内
   */
  ensurePageInRange: (
    pageCount: number,
    opts?: { resetTo?: 'first' | 'last' }
  ) => void
  /**
   * 筛选器配置
   * 传递给 FilterMenu 组件使用
   */
  filters?: FilterConfig[]
}
