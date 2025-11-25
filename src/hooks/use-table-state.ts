import { useState, useCallback, useMemo } from 'react'
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import type { FilterValue } from '@/types/data-grid'
import type { TableState, TableStateOptions, QueryParams } from '@/types/table'

/**
 * 表格状态管理 Hook
 *
 * 基于 FilterMenu 的筛选格式，自动将筛选、分页、排序条件转换为API查询参数
 */
export function useTableState(options: TableStateOptions = {}): TableState {
  const {
    pagination: paginationCfg = {},
    sorting: sortingCfg = {},
    filters = [],
  } = options

  const pageKey = paginationCfg.pageKey ?? 'page'
  const pageSizeKey = paginationCfg.pageSizeKey ?? 'pageSize'
  const defaultPage = paginationCfg.defaultPage ?? 1
  const defaultPageSize = paginationCfg.defaultPageSize ?? 10

  const sortByKey = sortingCfg.sortByKey ?? 'sortBy'
  const sortOrderKey = sortingCfg.sortOrderKey ?? 'sortOrder'
  const sortingEnabled = sortingCfg.enabled ?? true

  // 列筛选状态
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 分页状态
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Math.max(0, defaultPage - 1),
    pageSize: defaultPageSize,
  }))

  // 排序状态
  const [sorting, setSorting] = useState<SortingState>([])

  // 创建可筛选的列ID集合
  // 用于快速检查某个列是否允许筛选
  const filterableColumnIds = useMemo(() => {
    return new Set(filters.map((filter) => filter.columnId))
  }, [filters])

  // 列筛选变更处理
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      setColumnFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater

        // 检测筛选条件是否真的发生了变化
        const filtersChanged =
          prev.length !== next.length ||
          prev.some(
            (prevFilter, index) =>
              !next[index] ||
              prevFilter.id !== next[index].id ||
              JSON.stringify(prevFilter.value) !==
                JSON.stringify(next[index].value)
          ) ||
          next.some(
            (nextFilter, index) =>
              !prev[index] ||
              nextFilter.id !== prev[index].id ||
              JSON.stringify(nextFilter.value) !==
                JSON.stringify(prev[index].value)
          )

        // 筛选条件变化时，重置页码到第一页
        if (filtersChanged) {
          setPagination((p) => ({
            ...p,
            pageIndex: defaultPage - 1,
          }))
        }

        return next
      })
    },
    [defaultPage]
  )

  // 分页变更处理
  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
    },
    []
  )

  // 排序变更处理
  const onSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    setSorting((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  // 生成查询参数
  // 自动将筛选、分页、排序条件转换为API查询参数
  // 使用 useMemo 缓存结果，确保引用稳定
  const queryParams = useMemo((): QueryParams => {
    const params: QueryParams = {}

    // 添加分页参数
    const currentPage = pagination.pageIndex + 1
    if (currentPage > defaultPage) {
      params[pageKey] = currentPage
    }
    if (pagination.pageSize !== defaultPageSize) {
      params[pageSizeKey] = pagination.pageSize
    }

    // 添加排序参数
    if (sortingEnabled && sorting.length > 0) {
      params[sortByKey] = sorting[0].id
      params[sortOrderKey] = sorting[0].desc ? 'desc' : 'asc'
    }

    // 添加筛选参数
    // 使用 JSON 字符串方式序列化筛选条件，这是业界最佳实践
    // 格式：status='{"operator":"isNot","value":"active"}' (URL编码后)
    // 优点：结构清晰、易于扩展、兼容性好
    // 直接使用 columnId 作为 API 参数名，无需映射
    for (const filter of columnFilters) {
      // 只处理在 filters 配置中定义的列
      if (!filterableColumnIds.has(filter.id)) continue

      const filterValue = filter.value as FilterValue | undefined
      if (!filterValue) continue

      const { operator, value, value2 } = filterValue

      // 构建筛选对象
      // 对于不需要值的操作符，只传递 operator
      let filterObj: Record<string, unknown> | null = null

      if (
        operator === 'isEmpty' ||
        operator === 'isNotEmpty' ||
        operator === 'isTrue' ||
        operator === 'isFalse'
      ) {
        // 只包含 operator
        filterObj = { operator }
      } else if (operator === 'between' && value2 !== undefined) {
        // 范围查询：包含 operator, value, value2
        filterObj = { operator, value, value2 }
      } else if (value !== undefined && value !== null && value !== '') {
        // 普通查询：包含 operator 和 value
        filterObj = { operator, value }
      }

      // 跳过无效的筛选条件
      if (!filterObj) continue

      // 将筛选对象序列化为 JSON 字符串
      // 直接使用 columnId 作为 API 参数名
      // axios 会自动进行 URL 编码
      params[filter.id] = JSON.stringify(filterObj)
    }

    return params
  }, [
    pagination,
    defaultPage,
    defaultPageSize,
    pageKey,
    pageSizeKey,
    sortingEnabled,
    sorting,
    sortByKey,
    sortOrderKey,
    columnFilters,
    filterableColumnIds,
  ])

  // getQueryParams 返回缓存的 queryParams
  const getQueryParams = useCallback((): QueryParams => {
    return queryParams
  }, [queryParams])

  // 确保页码在有效范围内
  const ensurePageInRange = useCallback(
    (
      pageCount: number,
      opts: { resetTo?: 'first' | 'last' } = { resetTo: 'first' }
    ) => {
      const currentPage = pagination.pageIndex + 1
      if (pageCount > 0 && currentPage > pageCount) {
        setPagination((prev) => ({
          ...prev,
          pageIndex:
            opts.resetTo === 'last'
              ? Math.max(0, pageCount - 1)
              : defaultPage - 1,
        }))
      }
    },
    [pagination.pageIndex, defaultPage]
  )

  // 使用 useMemo 确保返回对象的引用在状态变化时更新
  return useMemo(
    () => ({
      columnFilters,
      onColumnFiltersChange,
      pagination,
      onPaginationChange,
      sorting: sortingEnabled ? sorting : undefined,
      onSortingChange: sortingEnabled ? onSortingChange : undefined,
      getQueryParams,
      ensurePageInRange,
      filters,
    }),
    [
      columnFilters,
      onColumnFiltersChange,
      pagination,
      onPaginationChange,
      sorting,
      sortingEnabled,
      onSortingChange,
      getQueryParams,
      ensurePageInRange,
      filters,
    ]
  )
}
