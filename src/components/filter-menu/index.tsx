import * as React from 'react'
import type {
  ColumnFilter,
  ColumnFiltersState,
  Table,
} from '@tanstack/react-table'
import type { FilterOperator, FilterValue, Option } from '@/types/data-grid'
import { SlidersHorizontal, X } from 'lucide-react'
import { getDefaultOperator } from '@/lib/data-grid-filters'
import { cn, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sortable, SortableOverlay } from '@/components/ui/sortable'
import { FilterPopoverContent } from './filter-list'

export type FilterMode = 'local' | 'remote'

export interface FilterConfig {
  columnId: string
  title?: string
  options?: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
    count?: number
  }>
  allowedOperators?: FilterOperator[]
}

export const TEXT = {
  FILTER_BUTTON: '筛选',
  FILTER_TITLE: '筛选条件',
  ADD_FILTER: '添加条件',
  RESET_FILTER: '清除全部',
  APPLY_FILTER: '应用筛选',
  APPLYING: '应用中…',
  SEARCH_FIELD: '搜索字段…',
  NO_FIELD_FOUND: '未找到字段',
  SEARCH_OPTION: '搜索选项…',
  NO_OPTION_FOUND: '未找到选项',
  VALUE_PLACEHOLDER: '输入值…',
  END_VALUE_PLACEHOLDER: '结束值…',
  CONNECTOR_FIRST: '当',
  CONNECTOR_REST: '且',
} as const

export const NO_VALUE_OPERATORS = new Set([
  'isEmpty',
  'isNotEmpty',
  'isTrue',
  'isFalse',
])

export function buildInitialFilterValue(variant: string): FilterValue {
  return { operator: getDefaultOperator(variant), value: '' }
}

export function getFilterValueText(fv: FilterValue | undefined): string {
  if (!fv) return ''
  const { operator, value, value2 } = fv
  if (NO_VALUE_OPERATORS.has(operator)) return ''
  if (operator === 'between')
    return value != null && value2 != null ? `${value} - ${value2}` : ''
  if (Array.isArray(value)) return value.length > 0 ? `${value.length} 项` : ''
  if (value instanceof Date) return formatDate(value)
  return String(value ?? '')
}

export function buildColumnMeta<TData>(
  table: Table<TData>,
  filters: FilterConfig[] | undefined
) {
  const columnLabels = new Map<string, string>()
  const columnVariants = new Map<string, string>()
  const filterOptionsMap = new Map<string, FilterConfig['options']>()
  const allowedOperatorsMap = new Map<
    string,
    FilterConfig['allowedOperators']
  >()
  const allFilterableColumns: Option[] = []

  const sources = filters?.length
    ? filters.map((f) => ({ config: f, col: table.getColumn(f.columnId) }))
    : table.getAllColumns().map((col) => ({ config: undefined, col }))

  for (const { col, config } of sources) {
    if (!col?.getCanFilter()) continue
    const label = config?.title ?? col.columnDef.meta?.label ?? col.id
    let variant = col.columnDef.meta?.cell?.variant ?? 'short-text'
    if (config?.options?.length) {
      filterOptionsMap.set(col.id, config.options)
      if (variant !== 'select' && variant !== 'multi-select') variant = 'select'
    }
    if (config?.allowedOperators?.length) {
      allowedOperatorsMap.set(col.id, config.allowedOperators)
    }
    columnLabels.set(col.id, label)
    columnVariants.set(col.id, variant)
    allFilterableColumns.push({ label, value: col.id })
  }

  return {
    columnLabels,
    columnVariants,
    filterOptionsMap,
    allowedOperatorsMap,
    allFilterableColumns,
  }
}

export interface FilterContextType<TData = any> {
  table: Table<TData>
  allFilterableColumns: Option[]
  unusedColumns: Option[]
  columnLabels: Map<string, string>
  columnVariants: Map<string, string>
  filterOptionsMap: Map<string, FilterConfig['options']>
  allowedOperatorsMap: Map<string, FilterConfig['allowedOperators']>
  editingFilterIds: Set<string>
  updateFilter: (filterId: string, updates: Partial<ColumnFilter>) => void
  removeFilter: (filterId: string) => void
  changeFilterField: (filterId: string, newColumnId: string) => void
}

export const FilterContext = React.createContext<FilterContextType | null>(null)

export function useFilterContext<TData>(): FilterContextType<TData> {
  const ctx = React.use(FilterContext)
  if (!ctx) throw new Error('useFilterContext 必须在 FilterMenu 内部使用')
  return ctx as FilterContextType<TData>
}

interface FilterMenuProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
  mode?: FilterMode
  onFiltersChange?: (filters: ColumnFilter[]) => void
  filters?: FilterConfig[]
}

export function FilterMenu<TData>({
  table,
  mode = 'local',
  onFiltersChange,
  filters,
  ...props
}: FilterMenuProps<TData>) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const appliedFilters = table.getState().columnFilters
  const [editingFilters, setEditingFilters] =
    React.useState<ColumnFiltersState>(appliedFilters)
  const [isPending, startTransition] = React.useTransition()

  const columnMeta = React.useMemo(
    () => buildColumnMeta(table, filters),
    [table, filters]
  )
  const editingFilterIds = React.useMemo(
    () => new Set(editingFilters.map((f) => f.id)),
    [editingFilters]
  )

  const unusedColumns = React.useMemo(
    () =>
      columnMeta.allFilterableColumns.filter(
        (col) => !editingFilterIds.has(col.value)
      ),
    [columnMeta.allFilterableColumns, editingFilterIds]
  )

  const updateFilter = React.useCallback(
    (filterId: string, updates: Partial<ColumnFilter>) =>
      setEditingFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
      ),
    []
  )

  const removeFilter = React.useCallback(
    (filterId: string) =>
      setEditingFilters((prev) => prev.filter((f) => f.id !== filterId)),
    []
  )

  const changeFilterField = React.useCallback(
    (filterId: string, newColumnId: string) => {
      const variant = columnMeta.columnVariants.get(newColumnId) ?? 'short-text'
      setEditingFilters((prev) =>
        prev.map((f) =>
          f.id === filterId
            ? { id: newColumnId, value: buildInitialFilterValue(variant) }
            : f
        )
      )
    },
    [columnMeta.columnVariants]
  )

  const addFilter = React.useCallback(() => {
    const firstCol = unusedColumns[0]
    if (!firstCol) return
    const variant =
      columnMeta.columnVariants.get(firstCol.value) ?? 'short-text'
    setEditingFilters((prev) => [
      ...prev,
      { id: firstCol.value, value: buildInitialFilterValue(variant) },
    ])
  }, [unusedColumns, columnMeta.columnVariants])

  const applyFilters = () => {
    startTransition(async () => {
      if (mode === 'local') table.setColumnFilters(editingFilters)
      else await onFiltersChange?.(editingFilters)
      setOpen(false)
    })
  }

  const resetFilters = React.useCallback(() => {
    setEditingFilters([])
    startTransition(async () => {
      if (mode === 'local') table.setColumnFilters([])
      else await onFiltersChange?.([])
    })
  }, [mode, table, onFiltersChange])

  const removeApplied = React.useCallback(
    (filterId: string) => {
      const next = appliedFilters.filter((f) => f.id !== filterId)
      if (mode === 'local') table.setColumnFilters(next)
      else onFiltersChange?.(next)
    },
    [appliedFilters, mode, table, onFiltersChange]
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (appliedFilters.length === 0) {
        const firstCol = columnMeta.allFilterableColumns[0]
        if (firstCol) {
          const variant =
            columnMeta.columnVariants.get(firstCol.value) ?? 'short-text'
          setEditingFilters([
            { id: firstCol.value, value: buildInitialFilterValue(variant) },
          ])
        } else {
          setEditingFilters([])
        }
      } else {
        setEditingFilters(appliedFilters)
      }
    }
    setOpen(newOpen)
  }

  const contextValue: FilterContextType<TData> = React.useMemo(
    () => ({
      table,
      allFilterableColumns: columnMeta.allFilterableColumns,
      unusedColumns,
      columnLabels: columnMeta.columnLabels,
      columnVariants: columnMeta.columnVariants,
      filterOptionsMap: columnMeta.filterOptionsMap,
      allowedOperatorsMap: columnMeta.allowedOperatorsMap,
      editingFilterIds,
      updateFilter,
      removeFilter,
      changeFilterField,
    }),
    [
      table,
      columnMeta,
      unusedColumns,
      editingFilterIds,
      updateFilter,
      removeFilter,
      changeFilterField,
    ]
  )

  const hasApplied = appliedFilters.length > 0

  return (
    <FilterContext value={contextValue}>
      <Sortable
        value={editingFilters}
        onValueChange={setEditingFilters}
        getItemValue={(item) => item.id}
      >
        <div className='flex flex-wrap items-center gap-1.5'>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant={hasApplied ? 'secondary' : 'outline'}
                size='sm'
                className={cn(
                  'h-8 gap-1.5 font-normal transition-all',
                  hasApplied &&
                    'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 border border-dashed'
                )}
              >
                <SlidersHorizontal className='h-3.5 w-3.5' />
                {TEXT.FILTER_BUTTON}
                {hasApplied && (
                  <Badge
                    variant='secondary'
                    className='ml-0.5 h-[18px] min-w-[18px] rounded px-1 font-mono text-[10px] font-semibold tabular-nums'
                  >
                    {appliedFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              aria-labelledby={`${id}-label`}
              align='start'
              className='flex w-full max-w-(--radix-popover-content-available-width) flex-col p-0 sm:min-w-[520px]'
              onOpenAutoFocus={(e) => e.preventDefault()}
              {...props}
            >
              <FilterPopoverContent
                labelId={`${id}-label`}
                editingFilters={editingFilters}
                isPending={isPending}
                canAddMore={unusedColumns.length > 0}
                onAdd={addFilter}
                onReset={resetFilters}
                onApply={applyFilters}
              />
            </PopoverContent>
          </Popover>

          {appliedFilters.map((filter) => (
            <ActiveFilterChip
              key={filter.id}
              label={columnMeta.columnLabels.get(filter.id) ?? filter.id}
              valueText={getFilterValueText(
                filter.value as FilterValue | undefined
              )}
              onRemove={() => removeApplied(filter.id)}
              onClick={() => setOpen(true)}
            />
          ))}
        </div>

        <SortableOverlay>
          <div className='bg-background flex h-9 items-center gap-2 rounded-md border px-3 opacity-80 shadow-sm'>
            <div className='bg-muted h-2.5 w-20 rounded' />
            <div className='bg-muted h-2.5 w-14 rounded' />
            <div className='bg-muted h-2.5 w-24 rounded' />
          </div>
        </SortableOverlay>
      </Sortable>
    </FilterContext>
  )
}

function ActiveFilterChip({
  label,
  valueText,
  onRemove,
  onClick,
}: {
  label: string
  valueText: string
  onRemove: () => void
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        'group bg-background hover:border-primary/40 hover:bg-primary/5 flex h-8 cursor-pointer items-center overflow-hidden rounded-md border text-xs transition-colors'
      )}
    >
      <button
        type='button'
        onClick={onClick}
        className='flex h-full items-center gap-1 px-2.5 text-left'
      >
        <span className='text-foreground font-medium'>{label}</span>
        {valueText && (
          <>
            <span className='text-muted-foreground/60'>·</span>
            <span className='text-muted-foreground max-w-[120px] truncate'>
              {valueText}
            </span>
          </>
        )}
      </button>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className='text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive flex h-full items-center border-l px-1.5 transition-colors'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  )
}
