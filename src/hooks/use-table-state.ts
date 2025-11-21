import { useState, useCallback } from 'react'
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import type { ApiParams, TableStateOptions, TableState } from '@/types/table'

/**
 * 表格状态管理 Hook
 *
 * 功能：
 * - 管理表格的内部状态（分页、排序、过滤等）
 * - 生成 API 请求参数
 * - 不操作页面 URL，仅用于构建 API 请求
 */
export function useTableState(params: TableStateOptions): TableState {
  const {
    pagination: paginationCfg,
    globalFilter: globalFilterCfg,
    sorting: sortingCfg,
    columnFilters: columnFiltersCfg = [],
  } = params

  const pageKey = paginationCfg?.pageKey ?? ('page' as string)
  const pageSizeKey = paginationCfg?.pageSizeKey ?? ('pageSize' as string)
  const defaultPage = paginationCfg?.defaultPage ?? 1
  const defaultPageSize = paginationCfg?.defaultPageSize ?? 10

  const globalFilterKey = globalFilterCfg?.key ?? ('filter' as string)
  const globalFilterEnabled = globalFilterCfg?.enabled ?? true
  const trimGlobal = globalFilterCfg?.trim ?? true

  const sortingEnabled = sortingCfg?.enabled ?? true
  const sortByKey = sortingCfg?.sortByKey ?? ('sortBy' as string)
  const sortOrderKey = sortingCfg?.sortOrderKey ?? ('sortOrder' as string)

  // 使用内部 state 管理列过滤器
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 使用内部 state 管理分页
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Math.max(0, defaultPage - 1),
    pageSize: defaultPageSize,
  }))

  // 使用内部 state 管理排序
  const [sorting, setSorting] = useState<SortingState>([])

  // 分页变更处理：仅更新内部 state
  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
    },
    []
  )

  // 全局过滤器 state
  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() => {
    if (!globalFilterEnabled) return undefined
    return ''
  })

  // 全局过滤器变更处理：仅更新内部 state，并在筛选条件变化时重置页码
  const onGlobalFilterChangeBase = useCallback<OnChangeFn<string>>(
    (updater) => {
      setGlobalFilter((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev ?? '') : updater
        const trimmedNext = trimGlobal ? next.trim() : next
        const trimmedPrev = trimGlobal ? (prev ?? '').trim() : (prev ?? '')

        // 检测全局过滤器是否真的发生了变化
        const filterChanged = trimmedPrev !== trimmedNext

        if (filterChanged) {
          // 筛选条件变化时，重置页码到第一页
          setPagination((p) => ({
            ...p,
            pageIndex: defaultPage - 1,
          }))
        }
        return trimmedNext
      })
    },
    [trimGlobal, defaultPage]
  )

  const onGlobalFilterChange: OnChangeFn<string> | undefined =
    globalFilterEnabled ? onGlobalFilterChangeBase : undefined

  // 排序变更处理：仅更新内部 state
  const onSortingChangeBase = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
    },
    []
  )

  const onSortingChange: OnChangeFn<SortingState> | undefined = sortingEnabled
    ? onSortingChangeBase
    : undefined

  // 列过滤器变更处理：仅更新内部 state，并在筛选条件变化时重置页码
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      setColumnFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        // 检测筛选条件是否真的发生了变化
        // 比较数组长度和每个过滤器的 id 和 value
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

        if (filtersChanged) {
          // 筛选条件变化时，重置页码到第一页
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

  // 生成 API 参数：将内部 state 转换为 API 请求参数
  const getApiParams = useCallback((): ApiParams => {
    const params: ApiParams = {}

    // 添加分页参数
    const currentPage = pagination.pageIndex + 1
    if (currentPage > defaultPage) {
      params[pageKey] = currentPage
    }
    if (pagination.pageSize !== defaultPageSize) {
      params[pageSizeKey] = pagination.pageSize
    }

    // 添加全局过滤器参数
    if (globalFilterEnabled && globalFilter && globalFilter.trim() !== '') {
      params[globalFilterKey] = globalFilter
    }

    // 添加排序参数
    if (sortingEnabled && sorting.length > 0) {
      params[sortByKey] = sorting[0].id
      params[sortOrderKey] = sorting[0].desc ? 'desc' : 'asc'
    }

    // 添加列过滤器参数
    for (const cfg of columnFiltersCfg) {
      const found = columnFilters.find((f) => f.id === cfg.columnId)
      const serialize = cfg.serialize ?? ((v: unknown) => v)
      if (cfg.type === 'string') {
        const value =
          typeof found?.value === 'string' ? (found.value as string) : ''
        if (value.trim() !== '') {
          params[cfg.searchKey] = serialize(value)
        }
      } else {
        // default to array type
        const value = Array.isArray(found?.value)
          ? (found!.value as unknown[])
          : []
        if (value.length > 0) {
          params[cfg.searchKey] = serialize(value)
        }
      }
    }

    return params
  }, [
    pagination,
    defaultPage,
    defaultPageSize,
    pageKey,
    pageSizeKey,
    globalFilterEnabled,
    globalFilter,
    globalFilterKey,
    sortingEnabled,
    sorting,
    sortByKey,
    sortOrderKey,
    columnFiltersCfg,
    columnFilters,
  ])

  // 确保页码在有效范围内：仅更新内部 state
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

  return {
    globalFilter: globalFilterEnabled ? (globalFilter ?? '') : undefined,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    sorting: sortingEnabled ? sorting : undefined,
    onSortingChange,
    getApiParams,
    ensurePageInRange,
  }
}
