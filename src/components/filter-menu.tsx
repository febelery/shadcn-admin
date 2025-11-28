import * as React from 'react'
import type {
  Column,
  ColumnFilter,
  ColumnFiltersState,
  Table,
} from '@tanstack/react-table'
import type { FilterOperator, FilterValue, Option } from '@/types/data-grid'
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  GripVertical,
  ListFilter,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  getDefaultOperator,
  getOperatorsForVariant,
} from '@/lib/data-grid-filters'
import { cn, formatDate } from '@/lib/utils'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const FILTER_SHORTCUT_KEY = 'f'
const REMOVE_FILTER_SHORTCUTS = ['backspace', 'delete']
const FILTER_DEBOUNCE_MS = 300

// 文本常量
const TEXT = {
  FILTER_BUTTON: '筛选',
  FILTER_TITLE_APPLIED: '筛选条件',
  FILTER_TITLE_NOT_APPLIED: '未应用筛选',
  FILTER_DESCRIPTION_APPLIED: '修改筛选条件以缩小数据范围。',
  FILTER_DESCRIPTION_NOT_APPLIED: '添加筛选条件以缩小数据范围。',
  ADD_FILTER: '添加筛选',
  RESET_FILTER: '重置筛选',
  APPLY_FILTER: '应用筛选',
  SEARCH_COLUMN: '搜索列...',
  NO_COLUMN_FOUND: '未找到列。',
  SEARCH_FIELD: '搜索字段...',
  NO_FIELD_FOUND: '未找到字段。',
  SEARCH_OPTION: '搜索选项...',
  NO_OPTION_FOUND: '未找到选项。',
  VALUE_PLACEHOLDER: '值',
  END_VALUE_PLACEHOLDER: '结束值',
} as const

/**
 * 筛选模式
 * - local: 本地筛选，直接操作 table.setColumnFilters
 * - remote: 远程筛选，通过 onFiltersChange 回调通知父组件
 */
export type FilterMode = 'local' | 'remote'

/**
 * 筛选器配置
 */
export interface FilterConfig {
  /**
   * 列 ID（同时也是 API 参数名）
   * 列 ID 应该与列定义中的 id 或 accessorKey 匹配
   */
  columnId: string
  /**
   * 筛选器标题
   */
  title?: string
  /**
   * 预定义的选项（用于 select/multi-select 类型的筛选器）
   */
  options?: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
    count?: number
  }>
  /**
   * 允许使用的操作符列表
   * 如果不指定，则使用该列类型默认的所有操作符
   * 例如：['is'] 表示只允许使用 'is' 操作符
   */
  allowedOperators?: FilterOperator[]
}

interface FilterMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>
  /**
   * 筛选模式，默认为 'local'
   * - local: 本地筛选，直接操作 table.setColumnFilters
   * - remote: 远程筛选，通过 onFiltersChange 回调通知父组件
   */
  mode?: FilterMode
  /**
   * 远程筛选模式下的回调函数，当筛选条件变化时调用
   */
  onFiltersChange?: (filters: ColumnFilter[]) => void
  /**
   * 筛选器配置，用于限制可筛选的列和提供预定义选项
   * 如果不提供，则从所有可筛选的列中获取
   */
  filters?: FilterConfig[]
}

/**
 * 全局筛选菜单组件
 * 支持本地筛选和远程筛选两种模式
 */
export function FilterMenu<TData>({
  table,
  mode = 'local',
  onFiltersChange,
  filters,
  ...props
}: FilterMenuProps<TData>) {
  const id = React.useId()
  const labelId = React.useId()
  const descriptionId = React.useId()
  const [open, setOpen] = React.useState(false)
  const addButtonRef = React.useRef<HTMLButtonElement>(null)

  // 当前已应用的筛选条件
  const appliedFilters = table.getState().columnFilters

  // 待应用的筛选条件（在弹窗中编辑的临时状态）
  const [pendingFilters, setPendingFilters] =
    React.useState<ColumnFiltersState>(appliedFilters)

  // 当弹窗打开时，同步已应用的筛选条件到待应用状态
  React.useEffect(() => {
    if (open) {
      setPendingFilters(appliedFilters)
    }
  }, [open, appliedFilters])

  // 更新待应用的筛选条件（不立即应用）
  const updatePendingFilters = React.useCallback(
    (updater: (prev: ColumnFilter[]) => ColumnFilter[]) => {
      setPendingFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
    },
    []
  )

  // 应用筛选条件
  const applyFilters = React.useCallback(() => {
    if (mode === 'local') {
      table.setColumnFilters(pendingFilters)
    } else {
      onFiltersChange?.(pendingFilters)
    }
    setOpen(false)
  }, [mode, table, onFiltersChange, pendingFilters])

  // 使用待应用的筛选条件进行显示（在弹窗中编辑的临时状态）
  const editingFilters = pendingFilters

  const {
    columnLabels,
    columns,
    columnVariants,
    filterOptionsMap,
    allowedOperatorsMap,
  } = React.useMemo(() => {
    const labels = new Map<string, string>()
    const variants = new Map<string, string>()
    const optionsMap = new Map<string, FilterConfig['options']>()
    const operatorsMap = new Map<string, FilterConfig['allowedOperators']>()
    const filteringIds = new Set(editingFilters.map((f) => f.id))
    const availableColumns: Option[] = []

    // 如果提供了 filters 配置，只使用配置中的列
    if (filters && filters.length > 0) {
      for (const filterConfig of filters) {
        const column = table.getColumn(filterConfig.columnId)
        if (!column || !column.getCanFilter()) continue

        const label =
          filterConfig.title ?? column.columnDef.meta?.label ?? column.id
        const variant = column.columnDef.meta?.cell?.variant ?? 'short-text'
        labels.set(column.id, label)
        variants.set(column.id, variant)

        // 如果提供了预定义选项，存储到映射中
        if (filterConfig.options && filterConfig.options.length > 0) {
          optionsMap.set(column.id, filterConfig.options)
          // 如果列的类型不是 select/multi-select，设置为 select
          if (variant !== 'select' && variant !== 'multi-select') {
            variants.set(column.id, 'select')
          }
        }

        // 如果提供了允许的操作符列表，存储到映射中
        if (
          filterConfig.allowedOperators &&
          filterConfig.allowedOperators.length > 0
        ) {
          operatorsMap.set(column.id, filterConfig.allowedOperators)
        }

        if (!filteringIds.has(column.id)) {
          availableColumns.push({ label, value: column.id })
        }
      }
    } else {
      // 如果没有提供 filters 配置，使用所有可筛选的列
      for (const column of table.getAllColumns()) {
        if (!column.getCanFilter()) continue

        const label = column.columnDef.meta?.label ?? column.id
        const variant = column.columnDef.meta?.cell?.variant ?? 'short-text'
        labels.set(column.id, label)
        variants.set(column.id, variant)

        if (!filteringIds.has(column.id)) {
          availableColumns.push({ label, value: column.id })
        }
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
      columnVariants: variants,
      filterOptionsMap: optionsMap,
      allowedOperatorsMap: operatorsMap,
    }
  }, [editingFilters, table, filters])

  const onFilterAdd = React.useCallback(() => {
    const firstColumn = columns[0]
    if (!firstColumn) return

    const variant = columnVariants.get(firstColumn.value) ?? 'short-text'
    const defaultOperator = getDefaultOperator(variant)

    updatePendingFilters((prevFilters) => [
      ...prevFilters,
      {
        id: firstColumn.value,
        value: {
          operator: defaultOperator,
          value: '',
        },
      },
    ])
  }, [columns, columnVariants, updatePendingFilters])

  const onFilterUpdate = React.useCallback(
    (filterId: string, updates: Partial<ColumnFilter>) => {
      updatePendingFilters((prevFilters) => {
        if (!prevFilters) return prevFilters
        return prevFilters.map((filter) =>
          filter.id === filterId ? { ...filter, ...updates } : filter
        )
      })
    },
    [updatePendingFilters]
  )

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      updatePendingFilters((prevFilters) =>
        prevFilters.filter((item) => item.id !== filterId)
      )
    },
    [updatePendingFilters]
  )

  const onFiltersReset = React.useCallback(() => {
    setPendingFilters([])
    // 立即应用空筛选
    if (mode === 'local') {
      table.setColumnFilters([])
    } else {
      onFiltersChange?.([])
    }
  }, [mode, table, onFiltersChange])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement &&
          event.target.contentEditable === 'true')
      ) {
        return
      }

      if (
        event.key.toLowerCase() === FILTER_SHORTCUT_KEY &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
        appliedFilters.length > 0
      ) {
        event.preventDefault()
        onFiltersReset()
      }
    },
    [appliedFilters.length, onFiltersReset]
  )

  return (
    <Sortable
      value={editingFilters}
      onValueChange={(newFilters) => updatePendingFilters(() => newFilters)}
      getItemValue={(item: ColumnFilter) => item.id}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='font-normal'
            onKeyDown={onTriggerKeyDown}
          >
            <ListFilter className='text-muted-foreground' />
            {TEXT.FILTER_BUTTON}
            {editingFilters.length > 0 && (
              <Badge
                variant='secondary'
                className='h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono text-[10.4px] font-normal'
              >
                {editingFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          className='flex w-full max-w-(--radix-popover-content-available-width) flex-col gap-3.5 p-4 sm:min-w-[480px]'
          side={props.side ?? 'bottom'}
          align={props.align ?? 'end'}
          onOpenAutoFocus={(e) => e.preventDefault()}
          {...props}
        >
          <div className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-1'>
              <h4 id={labelId} className='leading-none font-medium'>
                {editingFilters.length > 0
                  ? TEXT.FILTER_TITLE_APPLIED
                  : TEXT.FILTER_TITLE_NOT_APPLIED}
              </h4>
              <p
                id={descriptionId}
                className={cn(
                  'text-muted-foreground text-sm',
                  editingFilters.length > 0 && 'sr-only'
                )}
              >
                {editingFilters.length > 0
                  ? TEXT.FILTER_DESCRIPTION_APPLIED
                  : TEXT.FILTER_DESCRIPTION_NOT_APPLIED}
              </p>
            </div>
            <div className='flex items-center gap-1'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-8 w-8 p-0'
                    ref={addButtonRef}
                    onClick={onFilterAdd}
                    disabled={columns.length === 0}
                  >
                    <Plus className='h-4 w-4' />
                    <span className='sr-only'>{TEXT.ADD_FILTER}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='top'>{TEXT.ADD_FILTER}</TooltipContent>
              </Tooltip>
              {editingFilters.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      onClick={onFiltersReset}
                    >
                      <RotateCcw className='h-4 w-4' />
                      <span className='sr-only'>{TEXT.RESET_FILTER}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    {TEXT.RESET_FILTER}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {editingFilters.length > 0 && (
            <SortableContent asChild>
              <ul className='flex max-h-[400px] flex-col gap-2 overflow-y-auto p-1'>
                {editingFilters.map((filter, index) => (
                  <FilterItem
                    key={filter.id}
                    filter={filter}
                    index={index}
                    filterItemId={`${id}-filter-${filter.id}`}
                    columns={columns}
                    columnLabels={columnLabels}
                    columnVariants={columnVariants}
                    filterOptionsMap={filterOptionsMap}
                    allowedOperatorsMap={allowedOperatorsMap}
                    table={table}
                    onFilterUpdate={onFilterUpdate}
                    onFilterRemove={onFilterRemove}
                    onFilterFieldChange={(filterId, newColumnId) => {
                      const newVariant =
                        columnVariants.get(newColumnId) ?? 'short-text'
                      const newOperator = getDefaultOperator(newVariant)
                      updatePendingFilters((prevFilters) =>
                        prevFilters.map((f) =>
                          f.id === filterId
                            ? {
                                id: newColumnId,
                                value: {
                                  operator: newOperator,
                                  value: '',
                                },
                              }
                            : f
                        )
                      )
                    }}
                  />
                ))}
              </ul>
            </SortableContent>
          )}
          {editingFilters.length > 0 && (
            <div className='flex w-full items-center justify-end gap-2 border-t pt-3'>
              <Button size='sm' onClick={applyFilters} className='rounded'>
                <Check className='mr-2 h-4 w-4' />
                {TEXT.APPLY_FILTER}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 h-8 w-[140px] rounded-sm' />
          <div className='bg-primary/10 h-8 w-[140px] rounded-sm' />
          <div className='bg-primary/10 h-8 w-[140px] rounded-sm' />
          <div className='bg-primary/10 size-8 shrink-0 rounded-sm' />
          <div className='bg-primary/10 size-8 shrink-0 rounded-sm' />
        </div>
      </SortableOverlay>
    </Sortable>
  )
}

interface FilterItemProps<TData> {
  filter: ColumnFilter
  index: number
  filterItemId: string
  columns: Option[]
  columnLabels: Map<string, string>
  columnVariants: Map<string, string>
  filterOptionsMap: Map<string, FilterConfig['options']>
  allowedOperatorsMap: Map<string, FilterConfig['allowedOperators']>
  table: Table<TData>
  onFilterUpdate: (filterId: string, updates: Partial<ColumnFilter>) => void
  onFilterRemove: (filterId: string) => void
  onFilterFieldChange: (filterId: string, newColumnId: string) => void
}

function FilterItem<TData>({
  filter,
  index,
  filterItemId,
  columns,
  columnLabels,
  columnVariants,
  filterOptionsMap,
  allowedOperatorsMap,
  table,
  onFilterUpdate,
  onFilterRemove,
  onFilterFieldChange,
}: FilterItemProps<TData>) {
  const fieldListboxId = `${filterItemId}-field-listbox`
  const fieldTriggerId = `${filterItemId}-field-trigger`
  const operatorListboxId = `${filterItemId}-operator-listbox`
  const inputId = `${filterItemId}-input`

  const [showFieldSelector, setShowFieldSelector] = React.useState(false)
  const [showOperatorSelector, setShowOperatorSelector] = React.useState(false)

  const variant = columnVariants.get(filter.id) ?? 'short-text'
  const filterValue = filter.value as FilterValue | undefined
  const operator = filterValue?.operator ?? getDefaultOperator(variant)

  // 获取所有可用的操作符
  const allOperators = getOperatorsForVariant(variant)

  // 如果配置了允许的操作符列表，则过滤操作符
  const allowedOperators = allowedOperatorsMap.get(filter.id)
  const operators = allowedOperators
    ? allOperators.filter((op) => allowedOperators.includes(op.value))
    : allOperators
  const needsValue = !['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(
    operator
  )
  const needsSecondValue = ['between'].includes(operator)

  const column = table.getColumn(filter.id)

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (showFieldSelector || showOperatorSelector) {
        return
      }

      if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase())) {
        event.preventDefault()
        onFilterRemove(filter.id)
      }
    },
    [filter.id, showFieldSelector, showOperatorSelector, onFilterRemove]
  )

  const onOperatorChange = React.useCallback(
    (newOperator: FilterOperator) => {
      const currentValue = filterValue?.value
      const currentValue2 = filterValue?.value2

      onFilterUpdate(filter.id, {
        value: {
          operator: newOperator,
          value: currentValue,
          value2: currentValue2,
        },
      })
    },
    [filter.id, filterValue, onFilterUpdate]
  )

  // 如果当前操作符不在允许列表中，自动切换到第一个允许的操作符
  React.useEffect(() => {
    if (allowedOperators && allowedOperators.length > 0) {
      const currentOperator = filterValue?.operator
      if (currentOperator && !allowedOperators.includes(currentOperator)) {
        // 当前操作符不在允许列表中，切换到第一个允许的操作符
        onOperatorChange(allowedOperators[0])
      }
    }
  }, [allowedOperators, filterValue?.operator, onOperatorChange])

  const onValueChange = React.useCallback(
    (newValue: string | number | string[] | undefined) => {
      const currentFilterValue = filter.value as FilterValue | undefined
      const currentOperator =
        currentFilterValue?.operator ??
        getDefaultOperator(columnVariants.get(filter.id) ?? 'short-text')
      const currentValue2 = currentFilterValue?.value2

      onFilterUpdate(filter.id, {
        value: {
          operator: currentOperator,
          value: newValue,
          value2: currentValue2,
        },
      })
    },
    [filter.id, filter.value, columnVariants, onFilterUpdate]
  )

  const onValue2Change = React.useCallback(
    (newValue: string | number | string[] | undefined) => {
      const currentFilterValue = filter.value as FilterValue | undefined
      const currentOperator =
        currentFilterValue?.operator ??
        getDefaultOperator(columnVariants.get(filter.id) ?? 'short-text')
      const currentValue = currentFilterValue?.value

      onFilterUpdate(filter.id, {
        value: {
          operator: currentOperator,
          value: currentValue,
          value2: newValue as string | number | undefined,
        },
      })
    },
    [filter.id, filter.value, columnVariants, onFilterUpdate]
  )

  return (
    <SortableItem value={filter.id} asChild>
      <li
        id={filterItemId}
        tabIndex={-1}
        className='flex items-center gap-2'
        onKeyDown={onItemKeyDown}
      >
        <div className='min-w-[72px] text-center'>
          {index === 0 ? (
            <span className='text-muted-foreground text-sm'>条件</span>
          ) : (
            <span className='text-muted-foreground text-sm'>且</span>
          )}
        </div>
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              id={fieldTriggerId}
              aria-controls={fieldListboxId}
              variant='outline'
              size='sm'
              className='w-32 justify-between rounded font-normal'
            >
              <span className='truncate'>{columnLabels.get(filter.id)}</span>
              <ChevronsUpDown className='opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={fieldListboxId}
            align='start'
            className='w-40 p-0'
          >
            <Command>
              <CommandInput placeholder={TEXT.SEARCH_FIELD} />
              <CommandList>
                <CommandEmpty>{TEXT.NO_FIELD_FOUND}</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.value}
                      value={column.value}
                      onSelect={(value) => {
                        onFilterFieldChange(filter.id, value)
                        setShowFieldSelector(false)
                      }}
                    >
                      <span className='truncate'>{column.label}</span>
                      <Check
                        className={cn(
                          'ml-auto',
                          column.value === filter.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showOperatorSelector}
          onOpenChange={setShowOperatorSelector}
          value={operator}
          onValueChange={onOperatorChange}
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            size='sm'
            className='w-32 rounded lowercase'
          >
            <div className='truncate'>
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent id={operatorListboxId}>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value} className='lowercase'>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='min-w-36 flex-1'>
          {needsValue && column ? (
            <FilterInput
              variant={variant}
              operator={operator}
              column={column}
              inputId={inputId}
              value={filterValue?.value}
              onValueChange={onValueChange}
              filterOptions={filterOptionsMap.get(filter.id)}
            />
          ) : needsSecondValue && column ? (
            <FilterInput
              placeholder={TEXT.END_VALUE_PLACEHOLDER}
              variant={variant}
              operator={operator}
              column={column}
              inputId={`${inputId}-2`}
              value={filterValue?.value2}
              onValueChange={onValue2Change}
              filterOptions={filterOptionsMap.get(filter.id)}
            />
          ) : (
            <div className='dark:bg-input/30 h-8 w-full rounded border bg-transparent' />
          )}
        </div>
        <Button
          aria-controls={filterItemId}
          variant='outline'
          size='icon'
          className='size-8 rounded'
          onClick={() => onFilterRemove(filter.id)}
        >
          <Trash2 />
        </Button>
        <SortableItemHandle asChild>
          <Button variant='outline' size='icon' className='size-8 rounded'>
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </li>
    </SortableItem>
  )
}

interface FilterInputProps<TData> {
  variant: string
  operator: FilterOperator
  value: string | number | string[] | undefined
  column: Column<TData>
  inputId: string
  onValueChange: (value: string | number | string[] | undefined) => void
  placeholder?: string
  /**
   * 外部提供的筛选选项（优先级高于 column.columnDef.meta.cell.options）
   */
  filterOptions?: FilterConfig['options']
}

function FilterInput<TData>({
  variant,
  operator,
  value,
  column,
  inputId,
  onValueChange,
  placeholder = TEXT.VALUE_PLACEHOLDER,
  filterOptions,
}: FilterInputProps<TData>) {
  const [showValueSelector, setShowValueSelector] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)

  const debouncedOnChange = useDebouncedCallback(
    (newValue: string | number | string[] | undefined) => {
      onValueChange(newValue)
    },
    FILTER_DEBOUNCE_MS
  )

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const columnMeta = column.columnDef.meta
  const cellVariant = columnMeta?.cell

  // 优先使用外部提供的 filterOptions，否则使用 column 定义中的 options
  const selectOptions = React.useMemo(() => {
    if (filterOptions && filterOptions.length > 0) {
      return filterOptions
    }
    return cellVariant?.variant === 'select' ||
      cellVariant?.variant === 'multi-select'
      ? cellVariant.options
      : []
  }, [cellVariant, filterOptions])

  if (variant === 'number') {
    return (
      <Input
        id={inputId}
        type='number'
        inputMode='numeric'
        placeholder={placeholder}
        value={(localValue as number | undefined) ?? ''}
        onChange={(event) => {
          const val = event.target.value
          const newValue = val === '' ? undefined : Number(val)
          setLocalValue(newValue)
          debouncedOnChange(newValue)
        }}
        className='h-8 w-full rounded'
      />
    )
  }

  if (variant === 'date') {
    const inputListboxId = `${inputId}-listbox`
    const dateValue =
      localValue && typeof localValue === 'string'
        ? new Date(localValue)
        : undefined

    return (
      <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            aria-controls={inputListboxId}
            variant='outline'
            size='sm'
            className={cn(
              'h-8 w-full justify-start rounded font-normal',
              !dateValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon />
            <span className='truncate'>
              {dateValue ? formatDate(dateValue) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          id={inputListboxId}
          align='start'
          className='w-auto p-0'
        >
          <Calendar
            autoFocus
            captionLayout='dropdown'
            mode='single'
            selected={dateValue}
            onSelect={(date) => {
              const newValue = date ? date.toISOString() : undefined
              setLocalValue(newValue)
              onValueChange(newValue)
              setShowValueSelector(false)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  if (
    (variant === 'select' || variant === 'multi-select') &&
    selectOptions.length > 0
  ) {
    if (operator === 'isAnyOf' || operator === 'isNoneOf') {
      const selectedValues = Array.isArray(value) ? value : []
      const inputListboxId = `${inputId}-listbox`

      const selectedOptions = selectOptions.filter((option) =>
        selectedValues.includes(option.value)
      )

      return (
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              variant='outline'
              size='sm'
              className='h-8 w-full justify-start rounded font-normal'
            >
              {selectedOptions.length === 0 ? (
                <span className='text-muted-foreground'>{placeholder}</span>
              ) : (
                <>
                  <div className='flex items-center -space-x-2'>
                    {selectedOptions.map((selectedOption) =>
                      selectedOption.icon ? (
                        <div
                          key={selectedOption.value}
                          className='bg-background rounded-full border p-0.5'
                        >
                          <selectedOption.icon className='size-3.5' />
                        </div>
                      ) : null
                    )}
                  </div>
                  <span className='truncate'>
                    {selectedOptions.length > 1
                      ? `${selectedOptions.length} 项已选择`
                      : selectedOptions[0]?.label}
                  </span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={inputListboxId}
            align='start'
            className='w-48 p-0'
          >
            <Command>
              <CommandInput placeholder={TEXT.SEARCH_OPTION} />
              <CommandList>
                <CommandEmpty>{TEXT.NO_OPTION_FOUND}</CommandEmpty>
                <CommandGroup>
                  {selectOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          const newValues = isSelected
                            ? selectedValues.filter((v) => v !== option.value)
                            : [...selectedValues, option.value]
                          onValueChange(
                            newValues.length > 0 ? newValues : undefined
                          )
                        }}
                      >
                        {option.icon && <option.icon />}
                        <span className='truncate'>{option.label}</span>
                        {option.count && (
                          <span className='ml-auto font-mono text-xs'>
                            {option.count}
                          </span>
                        )}
                        <Check
                          className={cn(
                            'ml-auto',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )
    }

    const inputListboxId = `${inputId}-listbox`
    const selectedOption = selectOptions.find(
      (opt) => opt.value === (value as string)
    )

    return (
      <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            aria-controls={inputListboxId}
            variant='outline'
            size='sm'
            className='h-8 w-full justify-start rounded font-normal'
          >
            {selectedOption ? (
              <>
                {selectedOption.icon && <selectedOption.icon />}
                <span className='truncate'>{selectedOption.label}</span>
              </>
            ) : (
              <span className='text-muted-foreground'>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          id={inputListboxId}
          align='start'
          className='w-[200px] p-0'
        >
          <Command>
            <CommandInput placeholder={TEXT.SEARCH_OPTION} />
            <CommandList>
              <CommandEmpty>{TEXT.NO_OPTION_FOUND}</CommandEmpty>
              <CommandGroup>
                {selectOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange(option.value)
                      setShowValueSelector(false)
                    }}
                  >
                    {option.icon && <option.icon />}
                    <span className='truncate'>{option.label}</span>
                    {option.count && (
                      <span className='ml-auto font-mono text-xs'>
                        {option.count}
                      </span>
                    )}
                    <Check
                      className={cn(
                        'ml-auto',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Input
      id={inputId}
      type='text'
      placeholder={placeholder}
      className='h-8 w-full rounded'
      value={(localValue as string | undefined) ?? ''}
      onChange={(event) => {
        const val = event.target.value
        const newValue = val === '' ? undefined : val
        setLocalValue(newValue)
        debouncedOnChange(newValue)
      }}
    />
  )
}
